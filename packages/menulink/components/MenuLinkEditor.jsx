import { useMemo, useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { PublicMenuLinkPage } from "./PublicMenuLinkPage.jsx";

function makeId(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2)}`;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }

  return payload;
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-(--store-muted)">
      <span>{label}</span>
      {children}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-(--store-border) bg-(--store-page) px-4 py-3 text-sm text-(--store-text) shadow-inner  outline-none transition focus:border-(--store-ring) focus:ring-2 focus:ring-black/5"
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="min-h-24 w-full rounded-2xl border border-(--store-border) bg-(--store-page) px-4 py-3 text-sm text-(--store-text) shadow-inner  outline-none transition focus:border-(--store-ring) focus:ring-2 focus:ring-black/5"
    />
  );
}

function Section({ title, children, action }) {
  return (
    <section className="grid gap-4 rounded-[1.5rem] border border-(--store-border) bg-(--store-surface) p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-(--store-text)">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function MobilePreview({ data }) {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-4 grid gap-3">
        <div className="rounded-[2.5rem] border border-(--store-border) bg-(--store-strong) p-3 shadow-2xl ">
          <div className="h-[720px] overflow-hidden rounded-[2rem] bg-(--store-page)">
            <div className="scrollbar-thin scrollbar-thumb-(--store-border) scrollbar-track-transparent h-full overflow-y-auto">
              <PublicMenuLinkPage data={data} compact showAttribution={false} />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MenuLinkEditor({
  initialData,
  publicUrl,
  billing = {},
  selfHosted = false,
}) {
  const [data, setData] = useState(initialData);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const site = data.site;
  const canPublish = data.hasMenuLinkEntitlement;
  const publishLabel = site.published ? "Unpublish" : "Publish";
  const billingLabel = selfHosted
    ? "Self-hosted · publishing included"
    : billing.hasMenuLinkEntitlement
    ? "Subscription active"
    : billing.subscription?.status
    ? `Subscription ${billing.subscription.status}`
    : "Subscription required";
  const previewUrl = useMemo(
    () =>
      selfHosted
        ? `/menulink/${site.slug}`
        : publicUrl || `https://${site.slug}.dblshot.coffee`,
    [publicUrl, site.slug, selfHosted]
  );

  function patchSite(patch) {
    setData((current) => ({
      ...current,
      site: {
        ...current.site,
        ...patch,
      },
    }));
  }

  function updateList(key, id, patch) {
    setData((current) => ({
      ...current,
      [key]: current[key].map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  }

  function removeListItem(key, id) {
    setData((current) => ({
      ...current,
      [key]: current[key].filter((item) => item.id !== id),
    }));
  }

  async function persistDraft() {
    const payload = await requestJson("/api/dashboard/menulink/site", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    setData(payload);
    return payload;
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    setStatus("Saving...");

    try {
      await persistDraft();
      setStatus("Saved.");
    } catch (issue) {
      setError(issue.message);
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished() {
    if (busy) return;
    setBusy(true);
    setError("");
    setStatus(site.published ? "Unpublishing..." : "Publishing...");

    try {
      if (!site.published) await persistDraft();
      const payload = await requestJson("/api/dashboard/menulink/publish", {
        method: "POST",
        body: JSON.stringify({ published: !site.published }),
      });
      setData((current) =>
        site.published
          ? { ...current, site: { ...current.site, published: false } }
          : payload
      );
      setStatus(payload.site.published ? "Published." : "Unpublished.");
    } catch (issue) {
      setError(issue.message);
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  async function startBilling(path) {
    setError("");
    setStatus("Opening Stripe...");

    try {
      const payload = await requestJson(path, { method: "POST" });
      window.location.href = payload.url;
    } catch (issue) {
      setError(issue.message);
      setStatus("");
    }
  }

  return (
    <fieldset
      disabled={busy}
      aria-label="MenuLink editor"
      className="min-w-0 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start"
    >
      <div className="grid gap-6">
        <section className="rounded-[1.5rem] border border-(--store-border) bg-(--store-strong) p-6 text-(--store-inverse) shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">
                Your cafe page
              </h1>
              <p className="max-w-[58ch] text-sm/6 text-(--store-inverse-muted)">
                Manage the public menu, offers, and social links for one branded
                page.
              </p>
              <a
                className="inline-flex items-center gap-2 text-sm font-medium text-(--store-inverse) underline decoration-(--store-inverse-border) underline-offset-4"
                href={previewUrl}
                rel="noreferrer"
                target="_blank"
              >
                {previewUrl}
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                className="ml-4 inline-flex items-center gap-2 text-sm font-medium text-(--store-inverse) underline decoration-(--store-inverse-border) underline-offset-4"
                href="/dashboard/menulink/preview"
                rel="noreferrer"
                target="_blank"
              >
                Preview draft
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <div className="flex flex-wrap gap-3">
              {!selfHosted ? (
                <button
                  type="button"
                  onClick={() => startBilling("/api/billing/menulink-checkout")}
                  className="rounded-full bg-(--store-page) px-4 py-2 text-sm font-medium text-(--store-text)"
                >
                  {billing.hasMenuLinkEntitlement ? "Change plan" : "Subscribe"}
                </button>
              ) : null}
              {!selfHosted && billing.subscription ? (
                <button
                  type="button"
                  onClick={() => startBilling("/api/billing/portal")}
                  className="rounded-full border border-(--store-inverse-border) px-4 py-2 text-sm font-medium text-(--store-inverse)"
                >
                  Billing
                </button>
              ) : null}
              <button
                type="button"
                onClick={save}
                className="rounded-full bg-(--store-inverse) px-4 py-2 text-sm font-semibold text-(--store-text)"
              >
                Save
              </button>
              <button
                type="button"
                onClick={togglePublished}
                disabled={!canPublish && !site.published}
                className="rounded-full border border-(--store-inverse-border) px-4 py-2 text-sm font-medium text-(--store-inverse) disabled:cursor-not-allowed disabled:opacity-40"
              >
                {publishLabel}
              </button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-white/10 px-3 py-1">
              {site.published ? "Published" : "Draft"}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              {billingLabel}
            </span>
          </div>
          {status || error ? (
            <p
              role={error ? "alert" : "status"}
              className={`mt-4 text-sm ${
                error ? "text-red-200" : "text-(--store-inverse-muted)"
              }`}
            >
              {error || status}
            </p>
          ) : null}
        </section>

        <Section title="Profile">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Cafe name">
              <TextInput
                value={site.displayName}
                onChange={(event) =>
                  patchSite({ displayName: event.target.value })
                }
              />
            </Field>
            <Field label="MenuLink address">
              <TextInput
                value={site.slug}
                onChange={(event) => patchSite({ slug: event.target.value })}
              />
            </Field>
            <Field label="Logo or hero image URL">
              <TextInput
                value={site.logoUrl}
                onChange={(event) => patchSite({ logoUrl: event.target.value })}
              />
            </Field>
            <Field label="SEO title">
              <TextInput
                value={site.seoTitle}
                onChange={(event) =>
                  patchSite({ seoTitle: event.target.value })
                }
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Bio">
                <TextArea
                  value={site.bio}
                  onChange={(event) => patchSite({ bio: event.target.value })}
                />
              </Field>
            </div>
          </div>
        </Section>

        <Section
          title="Theme"
          action={
            <span className="text-sm text-(--store-muted)">
              Use brand-safe hex colours.
            </span>
          }
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Accent", "accentColor"],
              ["Background", "backgroundColor"],
              ["Text", "textColor"],
            ].map(([label, key]) => (
              <Field key={key} label={label}>
                <TextInput
                  value={site[key]}
                  onChange={(event) => patchSite({ [key]: event.target.value })}
                />
              </Field>
            ))}
          </div>
        </Section>

        <Section
          title="Links"
          action={
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-(--store-strong) px-4 py-2 text-sm font-medium text-(--store-inverse)"
              onClick={() =>
                setData((current) => ({
                  ...current,
                  links: [
                    ...current.links,
                    {
                      id: makeId("link"),
                      label: "",
                      url: "",
                      kind: "custom",
                      active: true,
                      sortOrder: current.links.length,
                    },
                  ],
                }))
              }
            >
              <Plus className="h-4 w-4" />
              Add link
            </button>
          }
        >
          <p className="text-sm text-(--store-muted)">
            Add menu, contact, directions, or review links. Review requests are
            shown to every visitor, regardless of their experience.
          </p>
          <div className="grid gap-3">
            {data.links.map((link) => (
              <div
                key={link.id}
                className="grid gap-3 rounded-2xl border border-(--store-border) bg-(--store-page) p-4 md:grid-cols-2"
              >
                <TextInput
                  aria-label="Link label"
                  placeholder="Instagram"
                  value={link.label}
                  onChange={(event) =>
                    updateList("links", link.id, { label: event.target.value })
                  }
                />
                <TextInput
                  aria-label="Link destination"
                  placeholder="https://instagram.com/yourcafe"
                  value={link.url}
                  onChange={(event) =>
                    updateList("links", link.id, { url: event.target.value })
                  }
                />
                <Field label="Link type">
                  <select
                    value={link.kind || "custom"}
                    onChange={(event) =>
                      updateList("links", link.id, { kind: event.target.value })
                    }
                    className="rounded-xl border border-(--store-border) bg-(--store-page) p-3 text-(--store-text)"
                  >
                    <option value="custom">Business link</option>
                    <option value="menu">Menu</option>
                    <option value="review">Review request</option>
                  </select>
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={link.active !== false}
                    onChange={(event) =>
                      updateList("links", link.id, {
                        active: event.target.checked,
                      })
                    }
                  />
                  Show link
                </label>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-(--store-border) text-(--store-muted)"
                  onClick={() => removeListItem("links", link.id)}
                  aria-label="Remove link"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Offers"
          action={
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-(--store-strong) px-4 py-2 text-sm font-medium text-(--store-inverse)"
              onClick={() =>
                setData((current) => ({
                  ...current,
                  offers: [
                    ...current.offers,
                    {
                      id: makeId("offer"),
                      title: "",
                      description: "",
                      ctaLabel: "",
                      ctaUrl: "",
                      active: true,
                      sortOrder: current.offers.length,
                    },
                  ],
                }))
              }
            >
              <Plus className="h-4 w-4" />
              Add offer
            </button>
          }
        >
          <div className="grid gap-3">
            {data.offers.map((offer) => (
              <div
                key={offer.id}
                className="grid gap-3 rounded-2xl border border-(--store-border) bg-(--store-page) p-4"
              >
                <TextInput
                  placeholder="Morning combo"
                  value={offer.title}
                  onChange={(event) =>
                    updateList("offers", offer.id, {
                      title: event.target.value,
                    })
                  }
                />
                <TextArea
                  placeholder="Coffee and pastry before 10am."
                  value={offer.description}
                  onChange={(event) =>
                    updateList("offers", offer.id, {
                      description: event.target.value,
                    })
                  }
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <TextInput
                    placeholder="Order now"
                    value={offer.ctaLabel}
                    onChange={(event) =>
                      updateList("offers", offer.id, {
                        ctaLabel: event.target.value,
                      })
                    }
                  />
                  <TextInput
                    placeholder="https://..."
                    value={offer.ctaUrl}
                    onChange={(event) =>
                      updateList("offers", offer.id, {
                        ctaUrl: event.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-(--store-border) text-(--store-muted)"
                    onClick={() => removeListItem("offers", offer.id)}
                    aria-label="Remove offer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Menu"
          action={
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-(--store-strong) px-4 py-2 text-sm font-medium text-(--store-inverse)"
              onClick={() =>
                setData((current) => ({
                  ...current,
                  menuSections: [
                    ...current.menuSections,
                    {
                      id: makeId("section"),
                      title: "",
                      description: "",
                      active: true,
                      sortOrder: current.menuSections.length,
                      items: [],
                    },
                  ],
                }))
              }
            >
              <Plus className="h-4 w-4" />
              Add section
            </button>
          }
        >
          <div className="grid gap-4">
            {data.menuSections.map((section) => (
              <MenuSectionEditor
                key={section.id}
                section={section}
                onChange={(patch) =>
                  setData((current) => ({
                    ...current,
                    menuSections: current.menuSections.map((item) =>
                      item.id === section.id ? { ...item, ...patch } : item
                    ),
                  }))
                }
                onRemove={() =>
                  setData((current) => ({
                    ...current,
                    menuSections: current.menuSections.filter(
                      (item) => item.id !== section.id
                    ),
                  }))
                }
              />
            ))}
          </div>
        </Section>
      </div>

      <MobilePreview data={data} />
    </fieldset>
  );
}

function MenuSectionEditor({ section, onChange, onRemove }) {
  function updateItem(itemId, patch) {
    onChange({
      items: section.items.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item
      ),
    });
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-(--store-border) bg-(--store-page) p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <TextInput
          placeholder="Coffee"
          aria-label="Section title"
          value={section.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
        <TextInput
          placeholder="House espresso and milk drinks"
          aria-label="Section description"
          value={section.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-(--store-border) text-(--store-muted)"
          onClick={onRemove}
          aria-label="Remove section"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-2">
        {section.items.map((item) => (
          <div
            key={item.id}
            className="grid gap-2 rounded-xl bg-(--store-surface) p-3 md:grid-cols-2 lg:grid-cols-3"
          >
            <TextInput
              placeholder="Flat white"
              aria-label="Item name"
              value={item.name}
              onChange={(event) =>
                updateItem(item.id, { name: event.target.value })
              }
            />
            <TextInput
              placeholder="Double shot, steamed milk"
              aria-label="Item description"
              value={item.description}
              onChange={(event) =>
                updateItem(item.id, { description: event.target.value })
              }
            />
            <TextInput
              placeholder="$5.00"
              aria-label="Item price"
              value={item.price}
              onChange={(event) =>
                updateItem(item.id, { price: event.target.value })
              }
            />
            <TextInput
              placeholder="GF, V"
              aria-label="Dietary information"
              value={item.dietaryTags}
              onChange={(event) =>
                updateItem(item.id, { dietaryTags: event.target.value })
              }
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.available !== false}
                onChange={(event) =>
                  updateItem(item.id, { available: event.target.checked })
                }
              />
              Available
            </label>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-(--store-border) text-(--store-muted)"
              onClick={() =>
                onChange({
                  items: section.items.filter(
                    (current) => current.id !== item.id
                  ),
                })
              }
              aria-label="Remove menu item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="inline-flex w-fit items-center gap-2 rounded-full border border-(--store-border) px-4 py-2 text-sm font-medium text-(--store-muted)"
        onClick={() =>
          onChange({
            items: [
              ...section.items,
              {
                id: makeId("item"),
                name: "",
                description: "",
                price: "",
                dietaryTags: "",
                available: true,
                sortOrder: section.items.length,
              },
            ],
          })
        }
      >
        <Plus className="h-4 w-4" />
        Add item
      </button>
    </div>
  );
}
