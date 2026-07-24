import { defineField, defineType } from "sanity";

/**
 * Recipe schema — the core document type for the blog.
 *
 * Key design decisions:
 * - `body` uses Portable Text (blockContent) which natively supports
 *   interleaving text with images — no separate gallery field needed.
 * - `ingredients` is a structured array (name + amount + unit + group)
 *   enabling the interactive checklist on the frontend.
 * - `instructions` is separate from `body` to enable the "jump to recipe"
 *   button and section-based navigation.
 * - Tags use references to the Tag document for multi-dimensional filtering.
 */
export default defineType({
  name: "recipe",
  title: "Przepis",
  type: "document",
  groups: [
    { name: "content", title: "Treść", default: true },
    { name: "recipe", title: "Przepis" },
    { name: "meta", title: "Meta / SEO" },
    { name: "carousel", title: "Karuzela" },
  ],
  fields: [
    // --- Content group ---
    defineField({
      name: "title",
      title: "Tytuł",
      type: "string",
      group: "content",
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      group: "content",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Data publikacji",
      type: "datetime",
      group: "content",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "mainImage",
      title: "Zdjęcie główne",
      type: "image",
      group: "content",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Tekst alternatywny",
          description: "Ważne dla SEO i dostępności",
        },
      ],
    }),
    defineField({
      name: "excerpt",
      title: "Krótki opis",
      type: "text",
      group: "content",
      rows: 3,
      description: "Wyświetlany na liście postów — max 200 znaków",
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: "body",
      title: "Treść posta",
      type: "blockContent",
      group: "content",
      description:
        "Główna treść posta — możesz wstawiać zdjęcia bezpośrednio w tekst",
    }),

    // --- Recipe group ---
    defineField({
      name: "ingredients",
      title: "Składniki",
      type: "array",
      group: "recipe",
      of: [
        {
          type: "object",
          name: "ingredient",
          title: "Składnik",
          fields: [
            defineField({
              name: "name",
              title: "Nazwa",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "amount",
              title: "Ilość",
              type: "string",
              description: 'np. "2", "1/2", "200"',
            }),
            defineField({
              name: "unit",
              title: "Jednostka",
              type: "string",
              description: 'np. "szt.", "g", "ml", "łyżka"',
            }),
            defineField({
              name: "group",
              title: "Grupa",
              type: "string",
              description:
                'Opcjonalna grupa składników, np. "Ciasto", "Krem", "Polewa"',
            }),
          ],
          preview: {
            select: {
              name: "name",
              amount: "amount",
              unit: "unit",
              group: "group",
            },
            prepare({ name, amount, unit, group }) {
              const qty = [amount, unit].filter(Boolean).join(" ");
              return {
                title: name,
                subtitle: [qty, group].filter(Boolean).join(" · "),
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: "instructions",
      title: "Sposób przyrządzania",
      type: "blockContent",
      group: "recipe",
      description: "Kroki przyrządzania — wydzielone od treści posta",
    }),
    defineField({
      name: "prepTime",
      title: "Czas przygotowania (min)",
      type: "number",
      group: "recipe",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "cookTime",
      title: "Czas gotowania (min)",
      type: "number",
      group: "recipe",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "servings",
      title: "Liczba porcji",
      type: "number",
      group: "recipe",
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: "nutritionInfo",
      title: "Wartości odżywcze",
      type: "object",
      group: "recipe",
      fields: [
        defineField({ name: "calories", title: "Kalorie (kcal)", type: "number" }),
        defineField({ name: "protein", title: "Białko (g)", type: "number" }),
        defineField({ name: "fat", title: "Tłuszcz (g)", type: "number" }),
        defineField({ name: "carbs", title: "Węglowodany (g)", type: "number" }),
        defineField({ name: "fiber", title: "Błonnik (g)", type: "number" }),
      ],
    }),

    // --- Meta group ---
    defineField({
      name: "tags",
      title: "Tagi",
      type: "array",
      group: "meta",
      of: [
        {
          type: "reference",
          to: [{ type: "tag" }],
        },
      ],
    }),
    defineField({
      name: "mainIngredient",
      title: "Główny składnik",
      type: "string",
      group: "meta",
    }),
    defineField({
      name: "isSponsored",
      title: "Wpis sponsorowany",
      type: "boolean",
      group: "meta",
      initialValue: false,
    }),
    defineField({
      name: "legacyBloggerUrl",
      title: "Oryginalny URL (Blogger)",
      type: "url",
      group: "meta",
      description: "Używany do generowania 301 redirectów",
    }),
    defineField({
      name: "legacyComments",
      title: "Historyczne komentarze (Blogger)",
      type: "array",
      group: "meta",
      description: "Komentarze przeniesione z oryginalnego bloga",
      of: [
        {
          type: "object",
          name: "legacyComment",
          fields: [
            defineField({ name: "author", title: "Autor", type: "string" }),
            defineField({ name: "content", title: "Treść", type: "text" }),
            defineField({ name: "publishedAt", title: "Data", type: "datetime" }),
          ],
          preview: {
            select: { title: "author", subtitle: "content" },
          },
        },
      ],
    }),
    defineField({
      name: "gallery",
      title: "Galeria zdjęć",
      type: "array",
      group: "content",
      description: "Dodatkowe zdjęcia posta, używane w karuzelach na liście postów",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            {
              name: "alt",
              type: "string",
              title: "Tekst alternatywny",
            },
          ],
        },
      ],
    }),

    // --- Carousel group ---
    defineField({
      name: "featuredForCarousel",
      title: "Wyróżniony w karuzeli",
      type: "boolean",
      group: "carousel",
      initialValue: false,
    }),
    defineField({
      name: "carouselImageLight",
      title: "Zdjęcie karuzeli (motyw jasny)",
      type: "image",
      group: "carousel",
      options: { hotspot: true },
      hidden: ({ document }) => !document?.featuredForCarousel,
    }),
    defineField({
      name: "carouselImageDark",
      title: "Zdjęcie karuzeli (motyw ciemny)",
      type: "image",
      group: "carousel",
      options: { hotspot: true },
      hidden: ({ document }) => !document?.featuredForCarousel,
    }),
  ],

  orderings: [
    {
      title: "Data publikacji (najnowsze)",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
    {
      title: "Tytuł A-Z",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
  ],

  preview: {
    select: {
      title: "title",
      date: "publishedAt",
      media: "mainImage",
      sponsored: "isSponsored",
    },
    prepare({ title, date, media, sponsored }) {
      const formattedDate = date
        ? new Date(date).toLocaleDateString("pl-PL")
        : "Brak daty";
      return {
        title: sponsored ? `⭐ ${title}` : title,
        subtitle: formattedDate,
        media,
      };
    },
  },
});
