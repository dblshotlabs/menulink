import { db, schema } from "./db.js";
import { createMenuLinkService } from "../../../packages/menulink/sites.js";
import { createMerchantService } from "../../../packages/menulink/merchants.js";
// A self-hosted installation owns its database and has no commercial entitlement.
export const menuLink = createMenuLinkService({
  db,
  schema,
  hasPublishAccess: async () => true,
});
export const merchants = createMerchantService({ db, schema });
