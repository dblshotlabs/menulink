import { requireMerchantApiContext } from "@/lib/session";
import { menuLink } from "@/lib/services";
const { getOrCreateMenuLinkSite, updateMenuLinkSite, setMenuLinkPublished } =
  menuLink;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const context = await requireMerchantApiContext(req, res);

  if (!context) {
    return;
  }

  try {
    const site = await setMenuLinkPublished(
      context.merchant.id,
      Boolean(req.body?.published)
    );
    return res.status(200).json(site);
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Unable to update publishing.",
    });
  }
}
