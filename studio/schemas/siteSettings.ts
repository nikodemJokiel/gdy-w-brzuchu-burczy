import { defineField, defineType } from "sanity";

/**
 * Site settings — singleton document for global blog configuration.
 * Controls site name, description, social links, footer content,
 * and cookie consent text.
 */
export default defineType({
  name: "siteSettings",
  title: "Ustawienia strony",
  type: "document",
  fields: [
    defineField({
      name: "siteName",
      title: "Nazwa strony",
      type: "string",
      initialValue: "Gdy w brzuchu burczy",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "siteDescription",
      title: "Opis strony",
      type: "text",
      rows: 3,
      initialValue: "Blog kulinarny ze sprawdzonymi, pysznymi przepisami",
    }),
    defineField({
      name: "socialLinks",
      title: "Media społecznościowe",
      type: "object",
      fields: [
        defineField({
          name: "facebook",
          title: "Facebook URL",
          type: "url",
        }),
        defineField({
          name: "instagram",
          title: "Instagram URL",
          type: "url",
        }),
      ],
    }),
    defineField({
      name: "footerText",
      title: "Tekst stopki",
      type: "blockContent",
    }),
    defineField({
      name: "copyrightNotice",
      title: "Klauzula praw autorskich",
      type: "text",
      rows: 3,
      initialValue:
        "Wszystkie treści, przepisy i fotografie zamieszczone na tej stronie są chronione prawem autorskim. Kopiowanie, rozpowszechnianie lub wykorzystywanie materiałów bez pisemnej zgody autora jest zabronione.",
    }),
    defineField({
      name: "cookieConsentText",
      title: "Tekst zgody na cookies",
      type: "text",
      rows: 2,
      initialValue:
        "Ta strona używa plików cookies w celu zapewnienia najlepszej jakości usług. Kontynuując przeglądanie, wyrażasz na to zgodę.",
    }),
    defineField({
      name: "contactEmail",
      title: "E-mail kontaktowy",
      type: "string",
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Ustawienia strony",
      };
    },
  },
});
