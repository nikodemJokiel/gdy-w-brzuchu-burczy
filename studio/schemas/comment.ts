import { defineField, defineType } from "sanity";

export default defineType({
  name: "comment",
  title: "Komentarze",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Imię (podpis)",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "bloggerId",
      title: "ID z Bloggera (tylko z migracji)",
      type: "string",
      hidden: true,
    }),
    defineField({
      name: "email",
      title: "Adres E-mail",
      type: "string",
      description: "Nie będzie widoczny publicznie, tylko do wglądu administratora.",
    }),
    defineField({
      name: "text",
      title: "Treść komentarza",
      type: "text",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "recipe",
      title: "Przypisany do przepisu",
      type: "reference",
      to: [{ type: "recipe" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "parentComment",
      title: "Odpowiedź na (Komentarz nadrzędny)",
      type: "reference",
      to: [{ type: "comment" }],
      description: "Jeśli to pole jest puste, jest to komentarz główny. Jeśli wypełnione, jest to odpowiedź.",
    }),
    defineField({
      name: "isApproved",
      title: "Zatwierdzony",
      type: "boolean",
      description: "Tylko zatwierdzone komentarze są widoczne na stronie.",
      initialValue: true,
    }),
    defineField({
      name: "createdAt",
      title: "Data utworzenia",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "text",
      isApproved: "isApproved",
    },
    prepare({ title, subtitle, isApproved }) {
      return {
        title: `${isApproved ? "✅" : "⏳"} ${title}`,
        subtitle: subtitle,
      };
    },
  },
});
