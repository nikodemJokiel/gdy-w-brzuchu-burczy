import { defineField, defineType } from "sanity";

/**
 * Tag schema — used for multi-dimensional categorization of recipes.
 * Tags are categorized into groups (meal type, ingredient, cuisine, etc.)
 * to power the filter panel and search on the frontend.
 */
export default defineType({
  name: "tag",
  title: "Tag",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      description: "Group this tag belongs to — used for filter panel organization",
      options: {
        list: [
          { title: "Typ posiłku", value: "mealType" },
          { title: "Składnik", value: "ingredient" },
          { title: "Kuchnia", value: "cuisine" },
          { title: "Dieta", value: "diet" },
          { title: "Okazja", value: "occasion" },
          { title: "Typ dania", value: "dishType" },
          { title: "Inne", value: "other" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "category",
    },
  },
});
