export function loadConfig(env = process.env) {
  const required = ["DATABASE_URL", "APP_URL", "BETTER_AUTH_SECRET"];
  const missing = required.filter((key) => !env[key]);
  if (missing.length)
    throw new Error(`Missing MenuLink configuration: ${missing.join(", ")}`);
  if (env.BETTER_AUTH_SECRET.length < 32)
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
  const origin = new URL(env.APP_URL);
  const local = ["localhost", "127.0.0.1"].includes(origin.hostname);
  if (
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    !(origin.protocol === "https:" || (local && origin.protocol === "http:"))
  ) {
    throw new Error(
      "APP_URL must be an HTTPS origin (HTTP is allowed only for loopback development)."
    );
  }
  if (
    env.BETTER_AUTH_URL &&
    new URL(env.BETTER_AUTH_URL).origin !== origin.origin
  ) {
    throw new Error("BETTER_AUTH_URL must match APP_URL.");
  }
  if (
    env.MENULINK_RUNTIME_MODE &&
    env.MENULINK_RUNTIME_MODE !== "self-hosted"
  ) {
    throw new Error(
      "The standalone app is self-hosted. Use DBLSHOT's platform adapter for hosted billing."
    );
  }
  const database = new URL(env.DATABASE_URL);
  if (!["postgres:", "postgresql:"].includes(database.protocol))
    throw new Error("DATABASE_URL must be a Postgres URL.");
  return {
    databaseUrl: env.DATABASE_URL,
    appUrl: origin.origin,
    authSecret: env.BETTER_AUTH_SECRET,
    allowSignup: env.MENULINK_ALLOW_SIGNUP === "true",
  };
}
