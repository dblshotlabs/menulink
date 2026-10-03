const RESERVED_MENULINK_SLUGS = new Set([
  "account",
  "admin",
  "api",
  "app",
  "assets",
  "dashboard",
  "dblshot",
  "login",
  "register",
  "static",
  "user",
  "waitlist",
  "www",
]);

function splitHostAndPort(host = "") {
  const normalizedHost = String(host || "")
    .trim()
    .toLowerCase()
    .split(",")[0];

  try {
    const parsed = new URL(`http://${normalizedHost}`);
    return {
      hostname: parsed.hostname,
      port: parsed.port,
    };
  } catch {
    return {
      hostname: "",
      port: "",
    };
  }
}

export function normalizeMenuLinkSlug(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 63);
}

export function isReservedMenuLinkSlug(value = "") {
  const slug = normalizeMenuLinkSlug(value);
  return !slug || RESERVED_MENULINK_SLUGS.has(slug);
}

export function getMenuLinkSlugForHost(host = "") {
  const { hostname } = splitHostAndPort(host);

  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return "";
  }

  for (const suffix of [".dblshot.coffee", ".dblshot.ngrok.app"]) {
    if (!hostname.endsWith(suffix)) {
      continue;
    }

    const slug = normalizeMenuLinkSlug(hostname.slice(0, -suffix.length));
    return isReservedMenuLinkSlug(slug) ? "" : slug;
  }

  return "";
}

export function getReservedMenuLinkSlugs() {
  return Array.from(RESERVED_MENULINK_SLUGS);
}
