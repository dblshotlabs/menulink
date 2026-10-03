import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "./db.js";
import { loadConfig } from "./config.js";
export function createAuth({ allowSignup } = {}) {
  const config = loadConfig();
  return betterAuth({
    baseURL: config.appUrl,
    secret: config.authSecret,
    trustedOrigins: [config.appUrl],
    database: drizzleAdapter(db, { provider: "pg", schema }),
    user: {
      additionalFields: { businessName: { type: "string", required: false } },
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp: !(allowSignup ?? config.allowSignup),
      minPasswordLength: 12,
    },
  });
}
export const auth = createAuth();
