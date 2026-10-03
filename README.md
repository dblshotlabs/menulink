# MenuLink: standalone and DBLSHOT hosting

MenuLink is the existing DBLSHOT cafe/food-truck link page extracted into a reusable core and a standalone Next.js app. The core renders menus, offers, prices, dietary information, business links and honest review requests. Self-hosted publishing is included and requires no DBLSHOT account, Stripe subscription, analytics or external reviews API.

MenuLink is licensed under MIT with copyright (c) 2026 DBLSHOT COFFEE PTY LTD, as confirmed by Rod. Existing authorship and commit history are preserved; see LICENSE and ATTRIBUTION.md in the standalone export. The public source repository is https://github.com/dblshotlabs/menulink. npm publishing and hosted deployment are separate release steps.

## Repository boundary

- `apps/menulink`: standalone app, Better Auth email/password login, local Postgres connection, HTTP routes and dedicated minimal migrations.
- `packages/menulink`: shared menu renderer/editor, persistence factory, slug/order helpers, and minimal auth/merchant/menu schema.
- DBLSHOT's existing routes adapt the same core to its existing auth, billing entitlements, domains and SEO. These commercial/platform adapters stay outside the standalone export.

This follows Cooee's separation between a self-hosted application and private marketing/commercial hosting infrastructure. It retains the existing Next.js, Drizzle/Postgres and Better Auth architecture rather than copying Cooee's unrelated integrations.

## Get the source

```sh
git clone https://github.com/dblshotlabs/menulink.git
cd menulink
```

## Start locally

Prerequisites: Bun 1.3 and Postgres 15 or newer. Create your own empty `menulink` database, then:

```sh
bun install --frozen-lockfile
cp apps/menulink/.env.example apps/menulink/.env
```

Edit the example with your own database URL, app origin and random auth secret of at least 32 characters. Never reuse the local test secret. `BETTER_AUTH_URL` must match `APP_URL`. HTTP is allowed only for localhost; public deployments require an HTTPS origin.

```sh
bun run migrate
```

Create the initial owner locally by supplying `MENULINK_OWNER_EMAIL`, `MENULINK_OWNER_NAME` and `MENULINK_OWNER_PASSWORD` (at least 12 characters) in your private environment, then run `bun run owner:create`. The CLI refuses to create an initial owner when users already exist. Passwords are hashed by Better Auth and never printed. Do not put them in shell history or source control. 

```sh
bun run dev
```

Open http://localhost:3205 and sign in. Edit `/dashboard/menulink`, save, preview the saved draft and publish. Your public page is `/menulink/YOUR-SLUG`. Public signup is disabled by default. Operators may explicitly set `MENULINK_ALLOW_SIGNUP=true` if they intend to accept registrations; each user gets a separate merchant page.

The standalone root commands above apply to the exported source. In the full DBLSHOT checkout, use `bun run --cwd apps/menulink db:migrate`, `bun run --cwd apps/menulink owner:create`, and `bun run menulink:dev`.

## Production

Install dependencies with the committed standalone lockfile, run `bun run build`, configure your private runtime environment, apply migrations, then run `bun run start`. `GET /api/ready` returns 200 only when Postgres is reachable. Back up Postgres before upgrades. Keep public auth origins on HTTPS.

The Dockerfile uses the standalone export root as its build context. Set runtime environment variables through the deployment provider, not build arguments. On Railway, configure the exported repository's app service plus Postgres, set `DATABASE_URL`, `APP_URL`, `BETTER_AUTH_URL`, and `BETTER_AUTH_SECRET`, and use `/api/ready` for health checks. Vercel can use `apps/menulink` as the project root with an externally supplied Postgres database; run migrations as a controlled release step. No live one-click template or hosted deployment is claimed: these require owner-approved repository publication and infrastructure workflow.

## Acceptance and testing

1. Sign-in protects the editor; unauthenticated API requests fail, and writes from another origin fail.
2. Saving preserves menus and honest review links; draft preview matches public visibility rules.
3. Self-hosted publication works without a subscription; DBLSHOT-hosted publication still requires its existing entitlement.
4. At mobile and desktop widths, menus remain readable and links work; an empty menu retains a helpful target.
5. Unpublishing removes public access. No customer outreach, rating gate, fabricated reviews or incentivized reviews are part of this product.

`bun test` runs shared presentation/config tests. The optional real HTTP test requires a fresh migrated loopback database named `menulink_standalone_test` and a running local app with the synthetic test secret used in the test. Set `MENULINK_STANDALONE_TEST_URL` and `MENULINK_STANDALONE_TEST_DATABASE_URL` to opt in. The test validates client isolation before writing and cleans up its synthetic records. The normal suite skips it.

## Known limits

Publishing saves current edits first. Failed draft saves roll back atomically; unpublishing preserves local unsaved edits. The standalone source has focused presentation, configuration and optional HTTP integration checks. A one-click deployment template and DBLSHOT production rollout remain separate release steps. No hosted deployment is claimed.
