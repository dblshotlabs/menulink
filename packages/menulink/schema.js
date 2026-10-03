import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .$defaultFn(() => new Date())
    .notNull(),
  businessName: text("business_name"),
  signupIntent: text("signup_intent"),
  waitlistJoinedAt: timestamp("waitlist_joined_at", { mode: "date" }),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: "date" }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    mode: "date",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: timestamp("updated_at", { mode: "date" }).$defaultFn(
    () => new Date()
  ),
});

export const merchant = pgTable(
  "merchant",
  {
    id: text("id").primaryKey(),
    businessName: text("business_name").notNull(),
    slug: text("slug").notNull(),
    status: text("status").default("active").notNull(),
    timeZone: text("time_zone").default("Australia/Brisbane").notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    createdAt: timestamp("created_at", { mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("merchant_slug_unique").on(table.slug),
    stripeCustomerUnique: uniqueIndex("merchant_stripe_customer_unique").on(
      table.stripeCustomerId
    ),
  })
);

export const merchantUser = pgTable(
  "merchant_user",
  {
    id: text("id").primaryKey(),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchant.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("owner").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    userMerchantUnique: uniqueIndex("merchant_user_user_merchant_unique").on(
      table.userId,
      table.merchantId
    ),
    userActiveIdx: index("merchant_user_user_active_idx").on(
      table.userId,
      table.active
    ),
  })
);

export const menulinkSite = pgTable(
  "menulink_site",
  {
    id: text("id").primaryKey(),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchant.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    bio: text("bio").default("").notNull(),
    logoUrl: text("logo_url").default("").notNull(),
    accentColor: text("accent_color").default("#2f6f4e").notNull(),
    backgroundColor: text("background_color").default("#fffaf2").notNull(),
    textColor: text("text_color").default("#1d1714").notNull(),
    seoTitle: text("seo_title").default("").notNull(),
    seoDescription: text("seo_description").default("").notNull(),
    published: boolean("published").default(false).notNull(),
    createdAt: timestamp("created_at", { mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("menulink_site_slug_unique").on(table.slug),
    merchantUnique: uniqueIndex("menulink_site_merchant_unique").on(
      table.merchantId
    ),
  })
);

export const menulinkLink = pgTable("menulink_link", {
  id: text("id").primaryKey(),
  siteId: text("site_id")
    .notNull()
    .references(() => menulinkSite.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  url: text("url").notNull(),
  kind: text("kind").default("custom").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const menulinkOffer = pgTable("menulink_offer", {
  id: text("id").primaryKey(),
  siteId: text("site_id")
    .notNull()
    .references(() => menulinkSite.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").default("").notNull(),
  ctaLabel: text("cta_label").default("").notNull(),
  ctaUrl: text("cta_url").default("").notNull(),
  startsAt: timestamp("starts_at", { mode: "date" }),
  endsAt: timestamp("ends_at", { mode: "date" }),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const menulinkMenuSection = pgTable("menulink_menu_section", {
  id: text("id").primaryKey(),
  siteId: text("site_id")
    .notNull()
    .references(() => menulinkSite.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").default("").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const menulinkMenuItem = pgTable("menulink_menu_item", {
  id: text("id").primaryKey(),
  sectionId: text("section_id")
    .notNull()
    .references(() => menulinkMenuSection.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").default("").notNull(),
  price: text("price").default("").notNull(),
  dietaryTags: text("dietary_tags").default("").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  available: boolean("available").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .$defaultFn(() => new Date())
    .notNull(),
});
