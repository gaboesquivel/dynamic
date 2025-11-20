# Vencura Documentation Site

Documentation site built with Nextra and Shadcn/ui components from `@vencura/ui`.

## Features

- **Nextra**: Documentation framework built on Next.js
- **Shadcn/ui**: UI components from `@vencura/ui`
- **Dark Mode**: Theme support via `next-themes`
- **Mobile-First**: Responsive design following mobile-first principles

## Development

```bash
# Start development server
pnpm dev

# Build
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint
```

## Structure

- `app/docs/` - Documentation pages (MDX files)
- `theme.config.tsx` - Nextra theme configuration
- `app/layout.tsx` - Root layout with theme provider

## Adding Documentation

Add new documentation pages by creating MDX files in `app/docs/`:

```mdx
# My New Page

Content here...
```

Nextra will automatically generate navigation from the file structure.
