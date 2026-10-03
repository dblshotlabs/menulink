import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL before migration.");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
try {
  await migrate(drizzle(sql), {
    migrationsFolder: new URL("../drizzle", import.meta.url).pathname,
  });
  console.log("MenuLink migrations applied.");
} finally {
  await sql.end();
}
