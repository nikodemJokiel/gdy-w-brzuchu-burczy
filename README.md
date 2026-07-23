# Gdy w brzuchu burczy... 🍳

A modern culinary blog rebuilt from Blogger using a headless CMS architecture.

## Tech Stack

- **Frontend:** [Astro](https://astro.build/) with React Islands Architecture
- **CMS:** [Sanity](https://www.sanity.io/) (Headless)
- **Hosting:** [Cloudflare Pages](https://pages.cloudflare.com/)
- **Search:** [Pagefind](https://pagefind.app/) (static WebAssembly search)
- **Comments:** [Giscus](https://giscus.app/) (GitHub Discussions)
- **Styling:** SCSS

## Project Structure (Monorepo)

```
├── studio/         # Sanity CMS Studio
├── web/            # Astro frontend
├── scripts/        # Migration & utility scripts
├── pnpm-workspace.yaml
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Installation

```bash
pnpm install
```

### Development

```bash
# Start Sanity Studio (http://localhost:3333)
pnpm dev:studio

# Start Astro dev server (http://localhost:4321)
pnpm dev:web
```

### Build

```bash
pnpm build:web
```

## Environment Variables

Create a `.env` file in the `web/` directory:

```env
PUBLIC_SANITY_PROJECT_ID=your_project_id
PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_token
```

## License

MIT
