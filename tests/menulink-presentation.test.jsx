import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicMenuLinkPage } from "../packages/menulink/components/PublicMenuLinkPage.jsx";
import {
  accentTextColor,
  getVisibleMenuLinkData,
  menuLinkAnchorProps,
  safeMenuLinkUrl,
} from "../packages/menulink/presentation";
const data = {
  site: {
    displayName: "Cafe",
    accentColor: "#ffffff",
    backgroundColor: "#fffaf2",
    textColor: "#1d1714",
  },
  links: [
    { id: "menu", label: "Menu", url: "#menu" },
    { id: "phone", label: "Call", url: "tel:+61712345678" },
    {
      id: "review",
      kind: "review",
      label: "Review on Google",
      url: "https://example.com/review",
    },
    {
      id: "hidden",
      label: "Hidden",
      url: "https://example.com",
      active: false,
    },
    { id: "unsafe", label: "Unsafe", url: "javascript:alert(1)" },
  ],
  offers: [],
  menuSections: [
    {
      id: "coffee",
      title: "Coffee",
      items: [
        {
          id: "flat-white",
          name: "Flat white",
          price: "$5",
          dietaryTags: "Milk",
        },
        { id: "sold-out", name: "Sold out", available: false },
      ],
    },
  ],
};
test("public and draft previews filter unavailable content and empty sections", () => {
  const visible = getVisibleMenuLinkData(data);
  expect(visible.links.map((link) => link.id)).toEqual([
    "menu",
    "phone",
    "review",
  ]);
  expect(visible.menuSections[0].items.map((item) => item.id)).toEqual([
    "flat-white",
  ]);
  expect(
    getVisibleMenuLinkData({
      ...data,
      menuSections: [{ title: "Empty", items: [] }],
    }).menuSections
  ).toEqual([]);
});
test("offers respect scheduling and exact expiration, rejecting invalid dates", () => {
  const offers = [
    {
      id: "live",
      title: "Live",
      startsAt: "2026-10-03T12:00:00Z",
      endsAt: "2026-10-04",
    },
    { id: "ended", title: "Ended", endsAt: "2026-10-03T12:00:00Z" },
    { id: "future", title: "Future", startsAt: "2026-10-04" },
    { id: "bad", title: "Bad", startsAt: "invalid" },
  ];
  expect(
    getVisibleMenuLinkData(
      { ...data, offers },
      Date.parse("2026-10-03T12:00:00Z")
    ).offers.map((offer) => offer.id)
  ).toEqual(["live"]);
});
test("URL validation and navigation preserve safe protocols", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "//example.com",
    "#",
    "#bad space",
  ])
    expect(safeMenuLinkUrl(url)).toBe("");
  expect(menuLinkAnchorProps("tel:+61712345678")).toEqual({
    href: "tel:+61712345678",
  });
  expect(menuLinkAnchorProps("#menu")).toEqual({ href: "#menu" });
  expect(menuLinkAnchorProps("https://example.com").rel).toBe(
    "noopener noreferrer"
  );
});
test("accent text remains readable on white and dark green", () => {
  expect(accentTextColor("#ffffff")).toBe("#000000");
  expect(accentTextColor("#2f6f4e")).toBe("#ffffff");
});
test("rendered menu includes unconditional review requests and excludes hidden content", () => {
  const html = renderToStaticMarkup(<PublicMenuLinkPage data={data} />);
  for (const text of [
    'id="menu"',
    "Flat white",
    "Leave an honest review",
    "Review on Google",
  ])
    expect(html).toContain(text);
  for (const text of [
    "Sold out",
    "Hidden",
    "Unsafe",
    "javascript:",
    'class="fixed',
  ])
    expect(html).not.toContain(text);
});

test("the menu link retains an accessible destination when every item is unavailable", () => {
  const empty = {
    ...data,
    links: [{ id: "menu", label: "Menu", url: " #menu " }],
    menuSections: [
      { title: "Coffee", items: [{ name: "Sold out", available: false }] },
    ],
  };
  const html = renderToStaticMarkup(<PublicMenuLinkPage data={empty} />);
  expect(html).toContain('id="menu"');
  expect(html).toContain("Our menu is being updated");
  expect(html).not.toContain("Sold out");
});
