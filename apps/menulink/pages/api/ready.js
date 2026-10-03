import { sql } from "@/lib/db";
export default async function handler(req, res) {
  try {
    await sql`select 1`;
    return res.status(200).json({ ready: true });
  } catch {
    return res.status(503).json({ ready: false });
  }
}
