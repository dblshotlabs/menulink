import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { loadConfig } from "../apps/menulink/lib/config.js";
import { MenuLinkEditor } from "../packages/menulink/components/MenuLinkEditor.jsx";
const env = {
  APP_URL: "https://menu.example.test",
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/menulink",
  BETTER_AUTH_SECRET: "synthetic-config-test-secret-32-characters",
};
test("self-host configuration requires no Stripe, DBLSHOT or analytics credentials", () => {
  expect(loadConfig(env).appUrl).toBe(env.APP_URL);
  expect(loadConfig(env).allowSignup).toBe(false);
  expect(() => loadConfig({ ...env, MENULINK_RUNTIME_MODE: "hosted" })).toThrow(
    "platform adapter"
  );
  expect(() =>
    loadConfig({ ...env, APP_URL: "http://public.example.test" })
  ).toThrow("HTTPS");
  expect(() =>
    loadConfig({ ...env, BETTER_AUTH_URL: "https://other.example.test" })
  ).toThrow("match");
  expect(() => loadConfig({ ...env, BETTER_AUTH_SECRET: "short" })).toThrow(
    "32"
  );
});
test("the shared editor hides billing in self-hosted mode and preserves hosted controls", () => {
  const initialData = {
    site: {
      id: "site",
      slug: "cafe",
      displayName: "Cafe",
      accentColor: "#2f6f4e",
      backgroundColor: "#fffaf2",
      textColor: "#1d1714",
      published: false,
    },
    links: [],
    offers: [],
    menuSections: [],
    hasMenuLinkEntitlement: true,
  };
  const selfHosted = renderToStaticMarkup(
    <MenuLinkEditor
      initialData={initialData}
      publicUrl="https://menu.example.test/menulink/cafe"
      selfHosted
    />
  );
  expect(selfHosted).toContain("publishing included");
  expect(selfHosted).not.toContain("Subscribe");
  const hosted = renderToStaticMarkup(
    <MenuLinkEditor
      initialData={{ ...initialData, hasMenuLinkEntitlement: false }}
      billing={{}}
    />
  );
  expect(hosted).toContain("Subscribe");
  expect(hosted).toContain("disabled");
});
