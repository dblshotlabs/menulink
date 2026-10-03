import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";
import { merchants } from "./services.js";
import { loadConfig } from "./config.js";
export async function getMerchantContext(req) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) return null;
  return {
    session,
    merchant: await merchants.getOrCreateMerchantForUser(session.user),
  };
}
export async function requireMerchantApiContext(req, res) {
  if (
    !["GET", "HEAD"].includes(req.method) &&
    req.headers.origin !== loadConfig().appUrl
  ) {
    res.status(403).json({ error: "Request origin is not allowed." });
    return null;
  }
  const context = await getMerchantContext(req);
  if (!context) {
    res.status(401).json({ error: "You need to sign in first." });
    return null;
  }
  return context;
}
export async function requirePageAuth(context) {
  const current = await getMerchantContext(context.req);
  return current || { redirect: { destination: "/login", permanent: false } };
}
