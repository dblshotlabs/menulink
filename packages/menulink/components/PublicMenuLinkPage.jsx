import {
  accentTextColor,
  getVisibleMenuLinkData,
  menuLinkAnchorProps,
  safeMenuLinkUrl,
} from "../presentation.js";

export function PublicMenuLinkPage({
  data,
  compact = false,
  showAttribution = true,
}) {
  const { site, links, offers, menuSections } = getVisibleMenuLinkData(data);
  const reviews = links.filter((link) => link.kind === "review");
  const primaryLinks = links.filter((link) => link.kind !== "review");
  const buttonStyle = {
    background: site.accentColor,
    color: accentTextColor(site.accentColor),
  };

  return (
    <main
      className={
        compact
          ? "min-h-full px-3 py-4 [overflow-wrap:anywhere]"
          : "min-h-screen px-4 py-5 [overflow-wrap:anywhere]"
      }
      style={{
        background: site.backgroundColor,
        color: site.textColor,
      }}
    >
      <div
        className={
          compact
            ? "mx-auto grid max-w-sm gap-4 pb-16"
            : "mx-auto grid max-w-xl gap-5 pb-20"
        }
      >
        <section className="grid gap-4 pt-4 text-center">
          {site.logoUrl ? (
            <img
              src={site.logoUrl}
              alt=""
              className={
                compact
                  ? "mx-auto h-20 w-20 rounded-full object-cover ring-4 ring-white/60"
                  : "mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-white/60"
              }
            />
          ) : (
            <div
              className={
                compact
                  ? "mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-white"
                  : "mx-auto flex h-24 w-24 items-center justify-center rounded-full text-3xl font-semibold text-white"
              }
              style={buttonStyle}
            >
              {site.displayName.slice(0, 1)}
            </div>
          )}
          <div className="space-y-2">
            <h1
              className={
                compact
                  ? "text-3xl font-semibold tracking-tight"
                  : "text-4xl font-semibold tracking-tight"
              }
            >
              {site.displayName}
            </h1>
            {site.bio ? (
              <p className="mx-auto max-w-[42ch] text-sm/6 opacity-75">
                {site.bio}
              </p>
            ) : null}
          </div>
        </section>

        {primaryLinks.length ? (
          <nav aria-label="Business links" className="grid gap-2">
            {primaryLinks.map((link) => (
              <a
                key={link.id}
                {...menuLinkAnchorProps(link.url)}
                className="rounded-2xl px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition motion-safe:hover:translate-y-[-1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                style={buttonStyle}
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}

        {offers.length ? (
          <section className="grid gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Offers</h2>
            {offers.map((offer) => (
              <article
                key={offer.id}
                className="rounded-2xl border border-black/10 bg-white p-4 text-stone-900"
              >
                <h3 className="font-semibold">{offer.title}</h3>
                {offer.description ? (
                  <p className="mt-1 text-sm/6 opacity-75">
                    {offer.description}
                  </p>
                ) : null}
                {offer.ctaLabel && safeMenuLinkUrl(offer.ctaUrl) ? (
                  <a
                    className="mt-3 inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white"
                    {...menuLinkAnchorProps(offer.ctaUrl)}
                    style={buttonStyle}
                  >
                    {offer.ctaLabel}
                  </a>
                ) : null}
              </article>
            ))}
          </section>
        ) : null}

        {menuSections.length ? (
          <section id="menu" className="grid scroll-mt-6 gap-4 pb-8">
            <h2 className="text-lg font-semibold tracking-tight">Menu</h2>
            {menuSections.map((section) => (
              <article
                key={section.id}
                className="rounded-2xl border border-black/10 bg-white p-4 text-stone-900"
              >
                <div className="mb-3">
                  <h3 className="text-xl font-semibold">{section.title}</h3>
                  {section.description ? (
                    <p className="text-sm/6 opacity-70">
                      {section.description}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-3">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[minmax(0,1fr)_minmax(0,auto)] gap-3 border-t border-black/10 pt-3 first:border-t-0 first:pt-0"
                    >
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        {item.description ? (
                          <p className="text-sm/6 opacity-70">
                            {item.description}
                          </p>
                        ) : null}
                        {item.dietaryTags ? (
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] opacity-60">
                            {item.dietaryTags}
                          </p>
                        ) : null}
                      </div>
                      {item.price ? (
                        <p className="text-sm font-semibold">{item.price}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        ) : links.some((link) => safeMenuLinkUrl(link.url) === "#menu") ? (
          <section id="menu" className="grid scroll-mt-6 gap-3 pb-8">
            <h2 className="text-lg font-semibold tracking-tight">Menu</h2>
            <p className="text-sm/6">
              Our menu is being updated. Please ask our team about today’s
              selection.
            </p>
          </section>
        ) : null}

        {reviews.length ? (
          <section
            id="reviews"
            aria-labelledby="reviews-heading"
            className="grid scroll-mt-6 gap-3"
          >
            <h2 id="reviews-heading" className="text-lg font-semibold">
              Share your experience
            </h2>
            <p className="text-sm/6">
              Visited us? Leave an honest review on your preferred platform.
            </p>
            {reviews.map((link) => (
              <a
                key={link.id}
                {...menuLinkAnchorProps(link.url)}
                style={buttonStyle}
                className="rounded-2xl px-4 py-3 text-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                {link.label}
              </a>
            ))}
          </section>
        ) : null}
      </div>
      {showAttribution ? (
        <footer
          className="flex-none flex items-center justify-center gap-2 px-4 py-4 text-xs font-medium"
          style={{
            background: `linear-gradient(to top, ${site.backgroundColor} 70%, transparent)`,
          }}
        >
          <span className="opacity-55">Powered by</span>
          <img
            src="/dblshot-logotype.svg"
            alt="DBLSHOT"
            className="h-3 w-auto opacity-65"
          />
        </footer>
      ) : null}
    </main>
  );
}
