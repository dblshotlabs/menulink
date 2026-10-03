// Shared by the public page and both draft previews.
export function safeMenuLinkUrl(value) {
  const url = typeof value === "string" ? value.trim().slice(0, 1000) : "";
  if (/^#[\w-]+$/.test(url)) return url;
  try {
    return ["https:", "http:", "mailto:", "tel:"].includes(
      new URL(url).protocol
    )
      ? url
      : "";
  } catch {
    return "";
  }
}

export function menuLinkAnchorProps(value) {
  const href = safeMenuLinkUrl(value);
  return /^https?:/i.test(href)
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : { href };
}

export function accentTextColor(color = "#2f6f4e") {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return "#ffffff";
  const channels = color
    .slice(1)
    .match(/../g)
    .map((hex) => {
      const value = parseInt(hex, 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return luminance > 0.179 ? "#000000" : "#ffffff";
}

export function getVisibleMenuLinkData(data, timestamp = Date.now()) {
  function inDateRange(offer) {
    const start = offer.startsAt
      ? new Date(offer.startsAt).getTime()
      : -Infinity;
    const end = offer.endsAt ? new Date(offer.endsAt).getTime() : Infinity;
    return start <= timestamp && timestamp < end;
  }
  return {
    ...data,
    links: (data.links || []).filter(
      (link) =>
        link.active !== false && link.label?.trim() && safeMenuLinkUrl(link.url)
    ),
    offers: (data.offers || []).filter(
      (offer) =>
        offer.active !== false && offer.title?.trim() && inDateRange(offer)
    ),
    menuSections: (data.menuSections || [])
      .filter((section) => section.active !== false && section.title?.trim())
      .map((section) => ({
        ...section,
        items: (section.items || []).filter(
          (item) => item.available !== false && item.name?.trim()
        ),
      }))
      .filter((section) => section.items.length),
  };
}
