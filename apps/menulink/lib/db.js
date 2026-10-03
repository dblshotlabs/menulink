import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../../../packages/menulink/schema.js";
import { loadConfig } from "./config.js";
const config = loadConfig();
export const sql = postgres(config.databaseUrl, { max: 10, prepare: false });
export const db = drizzle(sql, { schema });
export { schema };
