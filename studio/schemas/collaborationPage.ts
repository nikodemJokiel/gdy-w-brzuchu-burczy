import { defineField, defineType } from "sanity";

/**
 * Collaboration page schema — singleton document for the "Współpraca" page.
 * Showcases portfolio recipes, brand logos, and contact info for B2B.
 */
export default defineType({
  name: "collaborationPage",
  title: "Strona: Współpraca",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Tytuł",
      type: "string",
      initialValue: "Współpraca",
    }),
    defineField({
      name: "description",
      title: "Opis",
      type: "blockContent",
      description: "Opis możliwości współpracy",
    }),
    defineField({
      name: "portfolioRecipes",
      title: "Portfolio — wybrane przepisy",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "recipe" }],
        },
      ],
      description: "Przepisy wyświetlane jako portfolio prac (w tym sponsorowane)",
    }),
    defineField({
      name: "brandLogos",
      title: "Logotypy marek",
      type: "array",
      of: [
        {
          type: "image",
          fields: [
            {
              name: "brandName",
              type: "string",
              title: "Nazwa marki",
            },
          ],
        },
      ],
      description: "Logo marek, które skorzystały ze współpracy",
    }),
    defineField({
      name: "contactEmail",
      title: "E-mail kontaktowy",
      type: "string",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Współpraca" };
    },
  },
});
