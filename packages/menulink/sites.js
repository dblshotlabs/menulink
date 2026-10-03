import { and, asc, eq, inArray } from "drizzle-orm";
import { safeMenuLinkUrl as optionalUrl } from "./presentation.js";
import { isReservedMenuLinkSlug, normalizeMenuLinkSlug } from "./slugs.js";
import { normalizeOrderedRecords } from "./ordering.js";

export function createMenuLinkService({ db, schema, hasPublishAccess }) {
  if (typeof hasPublishAccess !== "function")
    throw new Error("A publication access adapter is required.");
  function id() {
    return crypto.randomUUID();
  }

  function now() {
    return new Date();
  }

  function text(value, maxLength = 500) {
    return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
  }

  function color(value, fallback) {
    const candidate = text(value, 20);
    return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : fallback;
  }

  async function isMenuLinkSlugAvailable(slug, currentSiteId = "") {
    const normalizedSlug = normalizeMenuLinkSlug(slug);

    if (isReservedMenuLinkSlug(normalizedSlug)) {
      return false;
    }

    const rows = await db
      .select({ id: schema.menulinkSite.id })
      .from(schema.menulinkSite)
      .where(eq(schema.menulinkSite.slug, normalizedSlug))
      .limit(1);
    const existing = rows[0];

    return !existing || existing.id === currentSiteId;
  }

  async function getOrCreateMenuLinkSite(merchant) {
    const existing = await getMenuLinkSiteForMerchant(merchant.id);

    if (existing?.site) {
      return existing;
    }

    const timestamp = now();
    const slug = await getAvailableSiteSlug(
      merchant.slug || merchant.businessName
    );
    const siteId = id();

    await db.insert(schema.menulinkSite).values({
      id: siteId,
      merchantId: merchant.id,
      slug,
      displayName: merchant.businessName || "My Cafe",
      bio: "",
      logoUrl: "",
      accentColor: "#2f6f4e",
      backgroundColor: "#fffaf2",
      textColor: "#1d1714",
      seoTitle: "",
      seoDescription: "",
      published: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await seedDefaultMenuLink(siteId);

    return getMenuLinkSiteForMerchant(merchant.id);
  }

  async function getAvailableSiteSlug(seed) {
    const base = normalizeMenuLinkSlug(seed) || `cafe-${id().slice(0, 8)}`;

    for (let index = 0; index < 50; index += 1) {
      const slug = index === 0 ? base : `${base}-${index + 1}`;

      if (await isMenuLinkSlugAvailable(slug)) {
        return slug;
      }
    }

    return `${base}-${id().slice(0, 8)}`;
  }

  async function getMenuLinkSiteForMerchant(merchantId) {
    const rows = await db
      .select()
      .from(schema.menulinkSite)
      .where(eq(schema.menulinkSite.merchantId, merchantId))
      .limit(1);
    const site = rows[0] || null;

    if (!site) {
      return null;
    }

    await ensureDefaultMenuLink(site.id);

    return {
      site,
      links: await getSiteLinks(site.id),
      offers: await getSiteOffers(site.id),
      menuSections: await getSiteMenu(site.id),
      hasMenuLinkEntitlement: await hasPublishAccess(merchantId),
    };
  }

  async function seedDefaultMenuLink(siteId) {
    const timestamp = now();

    await db.insert(schema.menulinkLink).values({
      id: id(),
      siteId,
      label: "View our menu",
      url: "#menu",
      kind: "menu",
      sortOrder: 0,
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async function ensureDefaultMenuLink(siteId) {
    const existingLinks = await db
      .select({ id: schema.menulinkLink.id })
      .from(schema.menulinkLink)
      .where(eq(schema.menulinkLink.siteId, siteId))
      .limit(1);

    if (existingLinks.length) {
      return;
    }

    await seedDefaultMenuLink(siteId);
  }

  async function getPublishedMenuLinkSiteBySlug(slug) {
    const normalizedSlug = normalizeMenuLinkSlug(slug);
    const rows = await db
      .select()
      .from(schema.menulinkSite)
      .where(
        and(
          eq(schema.menulinkSite.slug, normalizedSlug),
          eq(schema.menulinkSite.published, true)
        )
      )
      .limit(1);
    const site = rows[0] || null;

    if (!site) {
      return null;
    }

    const entitled = await hasPublishAccess(site.merchantId);

    if (!entitled) {
      return null;
    }

    const [links, offers, menuSections] = await Promise.all([
      getSiteLinks(site.id),
      getSiteOffers(site.id),
      getSiteMenu(site.id),
    ]);

    return {
      site,
      links: links.filter((link) => link.active),
      offers: offers.filter((offer) => offer.active),
      menuSections: menuSections
        .filter((section) => section.active)
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => item.available),
        })),
    };
  }

  async function updateMenuLinkSite(merchantId, payload = {}) {
    const current = await getOrCreateMenuLinkSite({
      id: merchantId,
      businessName: "My Cafe",
    });
    const site = current.site;
    const slug = normalizeMenuLinkSlug(payload.site?.slug || site.slug);

    if (!(await isMenuLinkSlugAvailable(slug, site.id))) {
      throw new Error("That MenuLink address is unavailable.");
    }

    const timestamp = now();
    await db.transaction(async (transaction) => {
      await transaction
        .update(schema.menulinkSite)
        .set({
          slug,
          displayName: text(payload.site?.displayName, 120) || site.displayName,
          bio: text(payload.site?.bio, 500),
          logoUrl: optionalUrl(payload.site?.logoUrl),
          accentColor: color(payload.site?.accentColor, "#2f6f4e"),
          backgroundColor: color(payload.site?.backgroundColor, "#fffaf2"),
          textColor: color(payload.site?.textColor, "#1d1714"),
          seoTitle: text(payload.site?.seoTitle, 120),
          seoDescription: text(payload.site?.seoDescription, 180),
          updatedAt: timestamp,
        })
        .where(eq(schema.menulinkSite.id, site.id));

      await replaceLinks(site.id, payload.links || [], transaction);
      await replaceOffers(site.id, payload.offers || [], transaction);
      await replaceMenu(site.id, payload.menuSections || [], transaction);
    });

    return getMenuLinkSiteForMerchant(merchantId);
  }

  async function setMenuLinkPublished(merchantId, published) {
    const siteData = await getMenuLinkSiteForMerchant(merchantId);

    if (!siteData?.site) {
      throw new Error("Create your MenuLink page before publishing.");
    }

    if (published && !siteData.hasMenuLinkEntitlement) {
      throw new Error("An active DBLSHOT subscription is required to publish.");
    }

    await db
      .update(schema.menulinkSite)
      .set({
        published: Boolean(published),
        updatedAt: now(),
      })
      .where(eq(schema.menulinkSite.id, siteData.site.id));

    return getMenuLinkSiteForMerchant(merchantId);
  }

  async function getSiteLinks(siteId) {
    return normalizeOrderedRecords(
      await db
        .select()
        .from(schema.menulinkLink)
        .where(eq(schema.menulinkLink.siteId, siteId))
        .orderBy(asc(schema.menulinkLink.sortOrder))
    );
  }

  async function getSiteOffers(siteId) {
    return normalizeOrderedRecords(
      await db
        .select()
        .from(schema.menulinkOffer)
        .where(eq(schema.menulinkOffer.siteId, siteId))
        .orderBy(asc(schema.menulinkOffer.sortOrder))
    );
  }

  async function getSiteMenu(siteId) {
    const sections = normalizeOrderedRecords(
      await db
        .select()
        .from(schema.menulinkMenuSection)
        .where(eq(schema.menulinkMenuSection.siteId, siteId))
        .orderBy(asc(schema.menulinkMenuSection.sortOrder))
    );

    return Promise.all(
      sections.map(async (section) => ({
        ...section,
        items: normalizeOrderedRecords(
          await db
            .select()
            .from(schema.menulinkMenuItem)
            .where(eq(schema.menulinkMenuItem.sectionId, section.id))
            .orderBy(asc(schema.menulinkMenuItem.sortOrder))
        ),
      }))
    );
  }

  async function replaceLinks(siteId, links, connection = db) {
    await connection
      .delete(schema.menulinkLink)
      .where(eq(schema.menulinkLink.siteId, siteId));

    for (const [sortOrder, link] of normalizeOrderedRecords(links).entries()) {
      const label = text(link.label, 80);
      const url = optionalUrl(link.url);

      if (!label || !url) {
        continue;
      }

      await connection.insert(schema.menulinkLink).values({
        id: link.id || id(),
        siteId,
        label,
        url,
        kind: text(link.kind, 40) || "custom",
        sortOrder,
        active: link.active !== false,
        createdAt: now(),
        updatedAt: now(),
      });
    }
  }

  async function replaceOffers(siteId, offers, connection = db) {
    await connection
      .delete(schema.menulinkOffer)
      .where(eq(schema.menulinkOffer.siteId, siteId));

    for (const [sortOrder, offer] of normalizeOrderedRecords(
      offers
    ).entries()) {
      const title = text(offer.title, 120);

      if (!title) {
        continue;
      }

      await connection.insert(schema.menulinkOffer).values({
        id: offer.id || id(),
        siteId,
        title,
        description: text(offer.description, 500),
        ctaLabel: text(offer.ctaLabel, 60),
        ctaUrl: optionalUrl(offer.ctaUrl),
        startsAt: offer.startsAt ? new Date(offer.startsAt) : null,
        endsAt: offer.endsAt ? new Date(offer.endsAt) : null,
        sortOrder,
        active: offer.active !== false,
        createdAt: now(),
        updatedAt: now(),
      });
    }
  }

  async function replaceMenu(siteId, sections, connection = db) {
    const existingSections = await connection
      .select({ id: schema.menulinkMenuSection.id })
      .from(schema.menulinkMenuSection)
      .where(eq(schema.menulinkMenuSection.siteId, siteId));

    if (existingSections.length) {
      await connection.delete(schema.menulinkMenuItem).where(
        inArray(
          schema.menulinkMenuItem.sectionId,
          existingSections.map((section) => section.id)
        )
      );
    }

    await connection
      .delete(schema.menulinkMenuSection)
      .where(eq(schema.menulinkMenuSection.siteId, siteId));

    for (const [sectionSortOrder, section] of normalizeOrderedRecords(
      sections
    ).entries()) {
      const title = text(section.title, 100);

      if (!title) {
        continue;
      }

      const sectionId = section.id || id();
      await connection.insert(schema.menulinkMenuSection).values({
        id: sectionId,
        siteId,
        title,
        description: text(section.description, 300),
        sortOrder: sectionSortOrder,
        active: section.active !== false,
        createdAt: now(),
        updatedAt: now(),
      });

      for (const [itemSortOrder, item] of normalizeOrderedRecords(
        section.items || []
      ).entries()) {
        const name = text(item.name, 120);

        if (!name) {
          continue;
        }

        await connection.insert(schema.menulinkMenuItem).values({
          id: item.id || id(),
          sectionId,
          name,
          description: text(item.description, 500),
          price: text(item.price, 40),
          dietaryTags: text(item.dietaryTags, 120),
          sortOrder: itemSortOrder,
          available: item.available !== false,
          createdAt: now(),
          updatedAt: now(),
        });
      }
    }
  }

  return {
    isMenuLinkSlugAvailable,
    getOrCreateMenuLinkSite,
    getMenuLinkSiteForMerchant,
    getPublishedMenuLinkSiteBySlug,
    updateMenuLinkSite,
    setMenuLinkPublished,
  };
}
