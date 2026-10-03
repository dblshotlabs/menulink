import { expect, test } from "bun:test";
const base = process.env.MENULINK_STANDALONE_TEST_URL;
const databaseUrl = process.env.MENULINK_STANDALONE_TEST_DATABASE_URL;
const standaloneTest = base && databaseUrl ? test : test.skip;
standaloneTest(
  "standalone HTTP auth, tenant isolation, saving and publication work without billing",
  async () => {
    const address = new URL(base);
    const database = new URL(databaseUrl);
    if (
      !["127.0.0.1", "localhost"].includes(address.hostname) ||
      !["127.0.0.1", "localhost"].includes(database.hostname) ||
      database.pathname !== "/menulink_standalone_test"
    )
      throw new Error(
        "Standalone smoke test requires a named loopback test database and server."
      );
    process.env.DATABASE_URL = databaseUrl;
    process.env.APP_URL = base;
    process.env.BETTER_AUTH_URL = base;
    process.env.BETTER_AUTH_SECRET =
      "synthetic-local-menulink-smoke-secret-not-for-release";
    const { createAuth } = await import("../apps/menulink/lib/auth.js");
    const { sql } = await import("../apps/menulink/lib/db.js");
    if (
      sql.options.database !== "menulink_standalone_test" ||
      sql.options.path ||
      !sql.options.host.every((host) =>
        ["127.0.0.1", "localhost"].includes(host)
      ) ||
      !sql.options.port.every((port) => port === Number(database.port || 5432))
    )
      throw new Error("Refusing mismatched standalone test client.");
    const email = `synthetic-${crypto.randomUUID()}@example.test`;
    const password = `synthetic-${crypto.randomUUID()}`;
    const userIds = [];
    try {
      expect((await fetch(`${base}/api/dashboard/menulink/site`)).status).toBe(
        401
      );
      const blockedSignup = await fetch(`${base}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: base },
        body: JSON.stringify({
          name: "Unwanted",
          email: "blocked@example.test",
          password,
        }),
      });
      expect(blockedSignup.status).not.toBe(200);
      const owner = await createAuth({ allowSignup: true }).api.signUpEmail({
        body: { name: "Synthetic Cafe", email, password },
      });
      userIds.push(owner.user.id);
      const signedIn = await fetch(`${base}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: base },
        body: JSON.stringify({ email, password }),
      });
      expect(signedIn.status).toBe(200);
      const cookie = signedIn.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
      expect(Boolean(cookie)).toBe(true);
      const headers = {
        Cookie: cookie,
        Origin: base,
        "Content-Type": "application/json",
      };
      const initialResponse = await fetch(
        `${base}/api/dashboard/menulink/site`,
        { headers }
      );
      expect(initialResponse.status).toBe(200);
      const data = await initialResponse.json();
      const otherEmail = `synthetic-${crypto.randomUUID()}@example.test`;
      const other = await createAuth({ allowSignup: true }).api.signUpEmail({
        body: { name: "Other Synthetic Cafe", email: otherEmail, password },
      });
      userIds.push(other.user.id);
      const otherLogin = await fetch(`${base}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: base },
        body: JSON.stringify({ email: otherEmail, password }),
      });
      expect(otherLogin.status).toBe(200);
      const otherCookie = otherLogin.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
      const otherSite = await fetch(
        `${base}/api/dashboard/menulink/site?merchantId=${data.site.merchantId}`,
        { headers: { Cookie: otherCookie } }
      );
      expect(otherSite.status).toBe(200);
      expect((await otherSite.json()).site.merchantId).not.toBe(
        data.site.merchantId
      );
      data.site.bio = "Saved through standalone HTTP";
      data.links.push({
        id: crypto.randomUUID(),
        label: "Honest review",
        url: "https://example.com/review",
        kind: "review",
      });
      data.menuSections = [
        {
          id: crypto.randomUUID(),
          title: "Coffee",
          items: [
            { id: crypto.randomUUID(), name: "Flat white", price: "$5.00" },
          ],
        },
      ];
      const forbidden = await fetch(`${base}/api/dashboard/menulink/site`, {
        method: "PUT",
        headers: { ...headers, Origin: "https://other.example.test" },
        body: JSON.stringify(data),
      });
      expect(forbidden.status).toBe(403);
      const saved = await fetch(`${base}/api/dashboard/menulink/site`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      });
      expect(saved.status).toBe(200);
      expect((await saved.json()).site.bio).toBe(data.site.bio);
      const published = await fetch(`${base}/api/dashboard/menulink/publish`, {
        method: "POST",
        headers,
        body: JSON.stringify({ published: true }),
      });
      expect(published.status).toBe(200);
      expect((await published.json()).site.published).toBe(true);
      const page = await fetch(`${base}/menulink/${data.site.slug}`);
      expect(page.status).toBe(200);
      const html = await page.text();
      expect(html).toContain("Flat white");
      expect(html).toContain("Honest review");
      expect(html).not.toContain("intercom");
      const preview = await fetch(`${base}/dashboard/menulink/preview`, {
        headers,
      });
      expect(preview.status).toBe(200);
      const off = await fetch(`${base}/api/dashboard/menulink/publish`, {
        method: "POST",
        headers,
        body: JSON.stringify({ published: false }),
      });
      expect(off.status).toBe(200);
      expect((await fetch(`${base}/menulink/${data.site.slug}`)).status).toBe(
        404
      );
      const signedOut = await fetch(`${base}/api/auth/sign-out`, {
        method: "POST",
        headers,
        body: "{}",
      });
      expect(signedOut.status).toBe(200);
      expect(
        (await fetch(`${base}/api/dashboard/menulink/site`, { headers })).status
      ).toBe(401);
    } finally {
      for (const userId of userIds) {
        await sql`delete from merchant where id in (select merchant_id from merchant_user where user_id = ${userId})`;
        await sql`delete from "user" where id = ${userId}`;
      }
      await sql.end();
    }
  },
  60000
);
