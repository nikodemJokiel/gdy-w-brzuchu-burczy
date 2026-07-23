import { defineField, defineType } from "sanity";

/**
 * About page schema — singleton document for the "O mnie" page.
 * Holds the author bio and photo.
 */
export default defineType({
  name: "aboutPage",
  title: "Strona: O mnie",
  type: "document",
  fields: [
    defineField({
      name: "bio",
      title: "Bio",
      type: "blockContent",
      description: "Opis autorki bloga",
    }),
    defineField({
      name: "photo",
      title: "Zdjęcie",
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Tekst alternatywny",
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "O mnie" };
    },
  },
});
