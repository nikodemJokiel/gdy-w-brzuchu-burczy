# Remake Bloga Kulinarnego "Gdy w brzuchu burczy" — Plan Implementacji

## Podsumowanie
Migracja bloga kulinarnego z Bloggera (675 postów, ~250 unikalnych tagów) na nowoczesny stack: **Astro + React Islands + Sanity CMS + Pagefind**, z hostingiem na Vercel/Cloudflare Pages. Projekt jest duży i wymaga podziału na fazy realizowane w kolejnych sesjach.

---

## Struktura Faz (7 faz)

> [!IMPORTANT]
> Projekt jest za duży na jedną sesję. Każda faza jest samodzielna i może być realizowana osobno. **Faza 1** wymaga Twojego udziału (tworzenie kont), więc zaczniemy od niej wspólnie.

### Faza 0: Przygotowanie środowiska i repozytoriów *(wymaga działań użytkownika)*
### Faza 1: Sanity CMS — schematy i konfiguracja Studio
### Faza 2: Migracja danych z Bloggera → Sanity
### Faza 3: Astro — struktura projektu, layout, routing
### Faza 4: Astro — strona główna, lista postów, filtry, wyszukiwarka
### Faza 5: Astro — strona przepisu (pełny post), nawigacja po sekcjach
### Faza 6: SEO, GEO, finalizacja i deployment
### Faza 7: (niskopriorytetowe) Karuzela, strony "o mnie"/"współpraca", i18n

---

## Faza 0: Przygotowanie środowiska

> [!IMPORTANT]
> Ta faza wymaga Twojego bezpośredniego działania — tworzenia kont na platformach.

### Konta do założenia:
1. **GitHub** — nowe repozytorium (np. `gdy-w-brzuchu-burczy`)
   - Publiczne lub prywatne, z licencją MIT
2. **Sanity.io** — konto na [sanity.io](https://www.sanity.io/), darmowy plan "Free"
   - Po rejestracji: utwórz nowy projekt w panelu → zanotuj **Project ID** i **Dataset** (domyślnie `production`)
   - Wygeneruj **API Token** (z uprawnieniami do zapisu — "Editor" lub wyżej) w Settings → API → Tokens
3. **Vercel** — konto na [vercel.com](https://vercel.com/) (podepnij repo z GitHuba)
4. **Giscus** — skonfiguruj na [giscus.app](https://giscus.app/) (wymaga publicznego repo z włączonymi Discussions)

### Konfiguracja lokalna:
- Node.js 18+ i npm/pnpm
- Git skonfigurowany i połączony z GitHubem

### Wynik:
- Repozytorium GitHub (puste, z README)
- Project ID i API Token z Sanity
- Konto Vercel podpięte do repo

---

## Faza 1: Sanity CMS — Schematy i Studio

### Cel: W pełni skonfigurowany CMS gotowy na import danych

#### [NEW] `studio/` — katalog Sanity Studio (osobny folder w monorepo)

Inicjalizacja za pomocą `npx -y sanity@latest init` (non-interactive z flagami).

#### Schematy dokumentów:

##### `studio/schemas/recipe.ts` — Schemat przepisu
Pola:
| Pole | Typ | Opis |
|------|-----|------|
| `title` | `string` | Tytuł przepisu (wymagany) |
| `slug` | `slug` | Generowany z tytułu, używany w URL |
| `publishedAt` | `datetime` | Data publikacji |
| `mainImage` | `image` z hotspot | Zdjęcie okładkowe (1:1) |
| `excerpt` | `text` | Krótki opis na listę postów |
| `body` | `array` of blocks | Portable Text — treść posta z obrazami inline |
| `ingredients` | `array` of objects | Lista składników z polami: `name`, `amount`, `unit`, `group` |
| `instructions` | `array` of blocks | Kroki przyrządzania (Portable Text) |
| `nutritionInfo` | `object` | Opcjonalne: kcal, białko, tłuszcz, węglowodany |
| `tags` | `array` of references → `tag` | Tagi wielowymiarowe |
| `mealType` | `string` (enum) | Rodzaj posiłku: śniadanie, obiad, kolacja, deser, przekąska |
| `mainIngredient` | `string` | Główny składnik |
| `diet` | `array` of strings | Dieta: bezglutenowe, bezmleczne, wegetariańskie, wegańskie |
| `prepTime` | `number` | Czas przygotowania (minuty) |
| `cookTime` | `number` | Czas gotowania (minuty) |
| `servings` | `number` | Liczba porcji |
| `isSponsored` | `boolean` | Czy wpis sponsorowany |
| `featuredForCarousel` | `boolean` | Czy wyróżniony do karuzeli |
| `carouselImageLight` | `image` | Zdjęcie do karuzeli (motyw jasny) |
| `carouselImageDark` | `image` | Zdjęcie do karuzeli (motyw ciemny) |
| `legacyBloggerUrl` | `url` | Oryginalny URL na Bloggerze (do 301 redirects) |
| `gallery` | `array` of images | Dodatkowe zdjęcia z posta |

##### `studio/schemas/tag.ts` — Schemat tagu
| Pole | Typ |
|------|-----|
| `name` | `string` |
| `slug` | `slug` |
| `category` | `string` (enum): `mealType`, `ingredient`, `cuisine`, `diet`, `occasion`, `other` |

##### `studio/schemas/collaborationPage.ts` — Strona współpracy/portfolio
| Pole | Typ |
|------|-----|
| `title` | `string` |
| `description` | `blockContent` |
| `portfolioRecipes` | `array` of references → `recipe` |
| `brandLogos` | `array` of images |
| `contactEmail` | `string` |

##### `studio/schemas/aboutPage.ts` — Strona "O mnie"
| Pole | Typ |
|------|-----|
| `bio` | `blockContent` |
| `photo` | `image` |

##### `studio/schemas/siteSettings.ts` — Ustawienia globalne
| Pole | Typ |
|------|-----|
| `siteName` | `string` |
| `siteDescription` | `text` |
| `socialLinks` | `object` (facebook, instagram) |
| `footerText` | `blockContent` |
| `cookieConsentText` | `text` |

#### Custom Studio components:
- **Ingredient Input** — komponent React do wygodnego dodawania składników (nazwa + ilość + jednostka)
- **Post Preview** — podgląd posta w Studio z nawigacją po sekcjach

---

## Faza 2: Migracja danych z Bloggera → Sanity

### Cel: Wszystkie 675 postów, zdjęcia, tagi i komentarze przeniesione do Sanity

#### [NEW] `scripts/migrate/` — Skrypty migracyjne (Node.js)

##### `scripts/migrate/01-fetch-rss.ts`
- Pobieranie pełnego RSS z Bloggera (pętla po `max-results=500&start-index=...`)
- Parsowanie XML → JSON z metadanymi (tytuł, data, tagi, treść HTML, URL)
- Zapis do `scripts/migrate/data/posts-raw.json`

##### `scripts/migrate/02-convert-html-to-portable-text.ts`
- Konwersja HTML Bloggera → Portable Text (format Sanity)
- Ekstrakcja obrazów z treści, listy składników (heurystyka: szukanie list `<ul>` z typowymi frazami składnikowymi)
- Separacja sekcji: opis, składniki, instrukcje

##### `scripts/migrate/03-download-and-upload-images.ts`
- Pobieranie obrazów z `blogger.googleusercontent.com`
- Upload do Sanity Asset API
- Podmiana referencji w Portable Text

##### `scripts/migrate/04-create-tags.ts`
- Deduplikacja i normalizacja tagów (jest ~250 unikalnych, wiele duplikatów z różną wielkością liter)
- Kategoryzacja automatyczna (np. "kurczak" → ingredient, "KUCHNIA WŁOSKA" → cuisine)
- Upload do Sanity

##### `scripts/migrate/05-upload-posts.ts`
- Upload przepisów do Sanity z referencjami do tagów i obrazów
- Zachowanie oryginalnych dat publikacji

##### `scripts/migrate/06-export-comments.ts`
- Pobieranie komentarzy z Blogger feeds API
- Eksport do formatu kompatybilnego z Giscus (mapowanie na GitHub Discussions)

> [!WARNING]
> Migracja komentarzy do Giscus jest ograniczona — Giscus bazuje na GitHub Discussions i nie ma oficjalnego API do masowego importu. Alternatywa: wyświetlanie starych komentarzy jako statycznych bloków w Sanity, a Giscus tylko dla nowych.

---

## Faza 3: Astro — Struktura projektu, layout, routing

### Cel: Działający szkielet strony z nawigacją, header, footer, tryb ciemny/jasny

#### [NEW] `web/` — Katalog Astro (osobny folder w monorepo)

Inicjalizacja: `npx -y create-astro@latest ./web` z integracjami React i SCSS.

#### Struktura plików:
```
web/
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro          # HTML shell, meta, fonty
│   ├── components/
│   │   ├── Header.astro              # Fixed header, logo, nawigacja
│   │   ├── HamburgerMenu.tsx         # React Island — mobilne menu z kategorii
│   │   ├── SearchBar.tsx             # React Island — Pagefind wyszukiwarka
│   │   ├── ThemeToggle.tsx           # React Island — przełącznik ciemny/jasny
│   │   ├── Footer.astro             # Stopka SEO
│   │   └── CookieConsent.tsx        # React Island — banner cookies
│   ├── styles/
│   │   ├── _variables.scss           # Design tokens, paleta kolorów
│   │   ├── _reset.scss               # CSS reset
│   │   ├── _typography.scss          # Czcionki (Inter/DM Sans z Google Fonts)
│   │   ├── _layout.scss              # Grid, marginesy, responsive breakpoints
│   │   └── global.scss               # Import wszystkich partials
│   ├── lib/
│   │   └── sanity.ts                 # Klient Sanity (GROQ queries)
│   ├── pages/
│   │   ├── index.astro               # Strona główna
│   │   ├── przepisy/
│   │   │   ├── index.astro           # Lista przepisów (z filtrami)
│   │   │   └── [slug].astro          # Strona konkretnego przepisu
│   │   ├── o-mnie.astro              # O mnie (placeholder)
│   │   ├── wspolpraca.astro          # Współpraca (placeholder)
│   │   ├── robots.txt.ts             # Dynamicznie generowany
│   │   ├── llms.txt.ts               # Plik llms.txt
│   │   └── sitemap-index.xml.ts      # Sitemap
│   └── utils/
│       ├── seo.ts                    # Helpery Schema.org JSON-LD
│       └── formatDate.ts            # Formatowanie dat
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

#### Design system:
- **Paleta kolorów:**
  - Jasny: tło `#FFFFFF`, tekst `#1A1A1A` lub ciemnozielony `#2D5A3D`, akcent `#4A8C5C`
  - Ciemny: tło `#171717`, tekst `#F5F5F5`, akcent zielony `#6BBF7B`
- **Czcionki:** `DM Sans` (nagłówki) + `Inter` (body) — bezszeryfowe, minimalistyczne
- **Breakpoints:** mobile `<640px`, tablet `640-1024px`, desktop `>1024px`
- **Nawigacja:** Hamburger menu (wybrane jako czystsze/bardziej minimalistyczne rozwiązanie)

#### Header:
- Position: fixed, z-index wysoki
- Centrum: Logo "Gdy w brzuchu burczy" (placeholder tekst + ikona)
- Prawa: FB, IG, theme toggle, "Współpraca", "O mnie"
- Lewa: Hamburger → menu z kategoriami + "Zobacz wszystko", wyszukiwarka Pagefind

#### Footer:
- SEO: linki do kategorii, polityka prywatności, copyright, prawa do zdjęć
- Social links, dane kontaktowe

---

## Faza 4: Strona główna + Lista postów + Filtry + Wyszukiwarka

### Cel: Działająca strona główna z grid postów, filtrami i wyszukiwarką (WYSOKI PRIORYTET)

#### Komponenty:

##### `PostGrid.astro` + `PostGridClient.tsx` (React Island)
- 3 kolumny (desktop) → 2 (tablet) → 1 (mobile)
- Każdy post: zdjęcie 1:1, tytuł (lewo), data DD/MM/YY (prawo), excerpt
- **Mobile:** swipe do kolejnych zdjęć posta (karuzela jak Instagram), kropeczki indykatory
- Ładowanie: 9/12 postów + przycisk "Zobacz więcej"
- Kliknięcie → `/przepisy/[slug]`

##### `FilterPanel.tsx` (React Island)
- Przycisk filtrowania (prawy górny róg sekcji postów)
- Wysuwalny panel z checkboxami kategorii
- Kategorie zgrupowane: Typ posiłku, Główny składnik, Dieta, Kuchnia, Okazja
- Multi-select: kilka filtrów naraz
- Badge z liczbą aktywnych filtrów
- Przycisk chowa się przy scroll w dół, pojawia przy scroll w górę

##### `SearchResults.astro`
- Wyniki sortowane: 1) trafienie w tag, 2) trafienie w treść, 3) od najnowszego
- Limit 9/12 + "załaduj więcej"
- Fallback: "Nie znaleziono wyników" + lista najnowszych postów

#### Integracja Pagefind:
- `data-pagefind-body` na treści postów
- Indeksowanie tagów jako `data-pagefind-filter`
- Build-time generation (po `astro build`)

---

## Faza 5: Strona przepisu (pełny post)

### Cel: Kompletna strona pojedynczego przepisu z nawigacją, składnikami, checkboxami (WYSOKI PRIORYTET)

#### Layout:
- **Desktop:** 2 kolumny — lewa: składniki (sticky/scroll niezależny), prawa: treść posta
- **Mobile:** 1 kolumna, z nawigacją po sekcjach na dole

#### Komponenty:

##### `RecipePage.astro`
- Tytuł, data, główne zdjęcie (`fetchpriority="high"`)
- Przycisk "Przejdź do przepisu" (pod zdjęciem)
- Treść z przeplatanymi zdjęciami (`loading="lazy"`, LQIP placeholders)
- Tagi jako linki do filtrowanej listy

##### `IngredientList.tsx` (React Island)
- Checkboxy do odznaczania składników
- Kliknięcie → przekreślenie + wyszarzenie
- Desktop: sticky w lewej kolumnie (scroll niezależny)
- Mobile: normalna sekcja w flow

##### `InstructionSteps.tsx` (React Island)
- Kroki z możliwością zaznaczania wykonanych

##### `RecipeTableOfContents.tsx` (React Island)
- Ikonki sekcji: Treść, Składniki, Przepis, Komentarze
- Desktop: boczny margines, sticky
- Mobile: dolny pasek nawigacji (fixed bottom)
- Podświetlanie aktywnej sekcji na podstawie scroll position (IntersectionObserver)

##### `Comments.tsx` (React Island)
- Giscus widget (lazy-loaded)
- Stare komentarze: statyczny blok z Sanity (jeśli zmigrowane)

#### Schema.org JSON-LD:
- `Recipe` schema: name, image, datePublished, description, prepTime, cookTime, ingredients, instructions, nutrition
- `FAQPage` jeśli post zawiera pytania

---

## Faza 6: SEO, GEO, finalizacja, deployment

### Cel: Pełna optymalizacja i publikacja

#### SEO:
- `<title>` i `<meta description>` na każdej stronie (dynamiczne z Sanity)
- Open Graph i Twitter Cards
- `sitemap.xml` (generowany przez `@astrojs/sitemap`)
- Kanoniczne URL-e

#### GEO (Generative Engine Optimization):
- `/llms.txt` — markdown z kompetencjami autorki i najlepszymi przepisami
- `/robots.txt`:
  ```
  User-agent: *
  Allow: /
  
  User-agent: OAI-SearchBot
  Allow: /
  
  User-agent: PerplexityBot
  Allow: /
  
  User-agent: GPTBot
  Disallow: /
  ```

#### Prawo:
- Klauzula copyright w stopce
- Wyłączenie right-click na zdjęciach (`oncontextmenu="return false"`)
- Polityka prywatności (strona)

#### Cookie consent:
- Minimalistyczny, nieinwazyjny banner na dole
- Akceptacja jednym kliknięciem

#### Deployment:
- Vercel: podpięcie repo, konfiguracja zmiennych środowiskowych (Sanity tokens)
- 301 redirecty: mapa starych URL-ów Bloggera → nowe slugi
- Preview deploys z Sanity webhook

#### Linters/Precommit:
- ESLint + Prettier
- Husky + lint-staged pre-commit hooks
- TypeScript strict mode

---

## Faza 7: Elementy niskopriorytetowe

### Karuzela na stronie głównej
- 4-5 wybranych przepisów
- Desktop: 3 sloty (środkowy duży, boczne wychodzące poza ekran)
- Animowana zmiana zdjęć przy przełączaniu motywu jasny/ciemny
- Dane z Sanity (`featuredForCarousel`, `carouselImageLight/Dark`)

### Strona "O mnie"
- Bio + zdjęcie (placeholders)
- CTA "Zapraszam do współpracy" → link do /wspolpraca

### Strona "Współpraca"
- Galeria wybranych przepisów (sponsorowane)
- Opis (placeholder)
- Dane kontaktowe, CTA
- Logotypy marek

### i18n (dwujęzyczność)
- Katalog `/en/` z przetłumaczonymi slugami
- Ikona zmiany języka w headerze
- Sanity: pola z wariantami językowymi

---

## User Review Required

> [!IMPORTANT]
> **Przed rozpoczęciem implementacji potrzebuję od Ciebie:**
> 1. **Utworzenie kont** na GitHub, Sanity.io, Vercel (i opcjonalnie Giscus)
> 2. **Podanie danych:** Sanity Project ID, Dataset name, API Token
> 3. **Potwierdzenie:** Czy chcesz używać nazwy repozytorium `gdy-w-brzuchu-burczy`?
> 4. **Potwierdzenie:** Vercel czy Cloudflare Pages jako hosting?

## Open Questions

> [!IMPORTANT]
> 1. **Hosting:** Vercel czy Cloudflare Pages? (Rekomenduję **Vercel** — lepsza integracja z Astro i preview deploys)
> 2. **Paleta kolorów:** Czarny tekst czy ciemnozielony w trybie jasnym? Propozycja: `#2D5A3D` (ciemnozielony) dla nagłówków, `#1A1A1A` (prawie czarny) dla body
> 3. **Komentarze historyczne:** Zachować jako statyczny blok (bezpieczne) czy próbować importować do Giscus (ryzykowne)?
> 4. **Monorepo czy osobne repozytoria?** Rekomenduję monorepo: `/studio` (Sanity) + `/web` (Astro) + `/scripts` (migracja)
> 5. **Menedżer pakietów:** npm czy pnpm? (Rekomenduję **pnpm** — szybszy, oszczędniejszy)

## Verification Plan

### Automated Tests
- `npm run build` — weryfikacja, że Astro generuje statyczne strony bez błędów
- `npx eslint .` — linting kodu
- Lighthouse CLI — wynik Performance ≥ 90, SEO ≥ 95
- Rich Results Test (Google) — walidacja Schema.org

### Manual Verification
- Sprawdzenie responsywności na urządzeniach mobilnych (Chrome DevTools)
- Test trybu ciemnego/jasnego
- Test wyszukiwarki Pagefind
- Test filtrów wielokrotnego wyboru
- Weryfikacja poprawności migracji treści (porównanie losowych postów z oryginałem)
- Test nawigacji po sekcjach przepisu (mobile + desktop)
