import { requireMerchantApiContext } from "@/lib/session";
import { menuLink } from "@/lib/services";
const { getOrCreateMenuLinkSite, updateMenuLinkSite, setMenuLinkPublished } =
  menuLink;

export default async function handler(req, res) {
  const context = await requireMerchantApiContext(req, res);

  if (!context) {
    return;
  }

  if (req.method === "GET") {
    const site = await getOrCreateMenuLinkSite(context.merchant);
    return res.status(200).json(site);
  }

  if (req.method !== "PUT") {
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const site = await updateMenuLinkSite(context.merchant.id, req.body || {});
    return res.status(200).json(site);
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Unable to save MenuLink.",
    });
  }
}
