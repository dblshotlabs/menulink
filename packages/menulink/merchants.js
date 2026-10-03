import { and, eq } from "drizzle-orm";
import { normalizeMenuLinkSlug } from "./slugs.js";

export function createMerchantService({ db, schema }) {
  function makeId() {
    return crypto.randomUUID();
  }

  function getTimestamp() {
    return new Date();
  }

  async function getActiveMerchantForUser(userId = "") {
    if (!userId) {
      return null;
    }

    const rows = await db
      .select({
        id: schema.merchant.id,
        businessName: schema.merchant.businessName,
        slug: schema.merchant.slug,
        status: schema.merchant.status,
        timeZone: schema.merchant.timeZone,
        stripeCustomerId: schema.merchant.stripeCustomerId,
        role: schema.merchantUser.role,
      })
      .from(schema.merchantUser)
      .innerJoin(
        schema.merchant,
        eq(schema.merchantUser.merchantId, schema.merchant.id)
      )
      .where(
        and(
          eq(schema.merchantUser.userId, userId),
          eq(schema.merchantUser.active, true),
          eq(schema.merchant.status, "active")
        )
      )
      .limit(1);

    return rows[0] || null;
  }

  async function getOrCreateMerchantForUser(user) {
    const existing = await getActiveMerchantForUser(user?.id);

    if (existing) {
      return existing;
    }

    const now = getTimestamp();
    const merchantId = makeId();
    const businessName = user?.businessName || user?.name || "My Cafe";
    const slugBase =
      normalizeMenuLinkSlug(businessName) || `cafe-${merchantId.slice(0, 8)}`;
    const slug = await getAvailableMerchantSlug(slugBase);

    await db.insert(schema.merchant).values({
      id: merchantId,
      businessName,
      slug,
      status: "active",
      timeZone: "Australia/Brisbane",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(schema.merchantUser).values({
      id: makeId(),
      merchantId,
      userId: user.id,
      role: "owner",
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    return getActiveMerchantForUser(user.id);
  }

  async function getAvailableMerchantSlug(slugBase) {
    for (let index = 0; index < 50; index += 1) {
      const slug = index === 0 ? slugBase : `${slugBase}-${index + 1}`;
      const rows = await db
        .select({ id: schema.merchant.id })
        .from(schema.merchant)
        .where(eq(schema.merchant.slug, slug))
        .limit(1);

      if (!rows[0]) {
        return slug;
      }
    }

    return `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;
  }

  async function updateMerchantStripeCustomerId(merchantId, stripeCustomerId) {
    if (!merchantId || !stripeCustomerId) {
      return;
    }

    await db
      .update(schema.merchant)
      .set({
        stripeCustomerId,
        updatedAt: getTimestamp(),
      })
      .where(eq(schema.merchant.id, merchantId));
  }

  return {
    getActiveMerchantForUser,
    getOrCreateMerchantForUser,
    updateMerchantStripeCustomerId,
  };
}
