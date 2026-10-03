import { createAuth } from "../lib/auth.js";
import { db, schema, sql } from "../lib/db.js";
const {
  MENULINK_OWNER_EMAIL: email,
  MENULINK_OWNER_PASSWORD: password,
  MENULINK_OWNER_NAME: name,
} = process.env;
try {
  if (!email || !name || !password || password.length < 12)
    throw new Error(
      "Set MENULINK_OWNER_EMAIL, MENULINK_OWNER_NAME, and a password of at least 12 characters."
    );
  if (
    (await db.select({ id: schema.user.id }).from(schema.user).limit(1)).length
  )
    throw new Error(
      "An owner already exists. Use the existing account or deliberately enable registration."
    );
  await createAuth({ allowSignup: true }).api.signUpEmail({
    body: { email, password, name },
  });
  console.log("MenuLink owner created. Public registration remains disabled.");
} finally {
  await sql.end();
}
