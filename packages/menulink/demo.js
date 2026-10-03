// Fictional sample; no ratings, testimonials, or real merchant review URLs.
export const demoData = {
  site: {
    displayName: "The Daily Shot",
    bio: "A fictional cafe and coffee truck. Espresso, breakfast and a warm welcome.",
    accentColor: "#2f6f4e",
    backgroundColor: "#fffaf2",
    textColor: "#1d1714",
  },
  links: [
    { id: "menu", label: "View our menu", url: "#menu", kind: "menu" },
    {
      id: "review",
      label: "Review request example",
      url: "#demo-review",
      kind: "review",
    },
  ],
  offers: [
    {
      id: "breakfast",
      title: "Breakfast combo · $12",
      description: "Any small coffee with a breakfast roll. Sample offer only.",
    },
  ],
  menuSections: [
    {
      id: "coffee",
      title: "Coffee",
      description: "Oat milk available · add $0.80",
      items: [
        {
          id: "espresso",
          name: "Espresso",
          description: "Double shot of our house blend",
          price: "$4.00",
        },
        {
          id: "flat-white",
          name: "Flat white",
          description: "Espresso with steamed milk",
          price: "$5.00",
          dietaryTags: "Contains milk",
        },
      ],
    },
    {
      id: "food",
      title: "From the truck",
      items: [
        {
          id: "roll",
          name: "Breakfast roll",
          description: "Egg, cheese and tomato relish",
          price: "$8.00",
          dietaryTags: "Vegetarian · contains egg, milk, wheat",
        },
      ],
    },
  ],
};
