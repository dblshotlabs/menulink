const { defineConfig } = require("drizzle-kit");
module.exports = defineConfig({
  schema: "../../packages/menulink/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
});
