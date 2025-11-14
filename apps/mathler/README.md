# Mathler

A Mathler game built with Next.js - like Wordle but with numbers. Users have 6 guesses to find the equation that equals a daily number.

## Current Status

⚠️ **This app is currently in early development** - it contains a basic Next.js setup with placeholder content. The game logic and features are not yet implemented.

## Planned Features

- Daily puzzles with changing target numbers
- ~~Dynamic SDK integration for authentication~~ ✅ **Completed**
- User history stored in Dynamic metadata
- Color-coded feedback (green/yellow/grey tiles)
- Order of operations support
- Crypto-related features (NFT minting, token rewards, etc.)
- Keyboard and mouse controls
- Responsive UI/UX design

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Dynamic SDK
- Tailwind CSS
- Shadcn/ui components (via `@workspace/ui`)

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm (package manager)
- Dynamic SDK environment ID (see Environment Variables below)

### Installation

```bash
# From monorepo root
pnpm install

# Or from this directory
cd apps/mathler
pnpm install
```

### Running the Application

```bash
# From monorepo root
pnpm dev

# Or from this directory
cd apps/mathler
pnpm dev
```

The application will be available at `http://localhost:3002` (or the next available port).

### Environment Variables

Create a `.env.local` file in the `apps/mathler` directory with the following:

```bash
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your-dynamic-environment-id
```

If not provided, the app will use a placeholder ID. Get your Dynamic environment ID from the [Dynamic Dashboard](https://app.dynamic.xyz/).

## Development

```bash
# Development mode
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint

# Type check
pnpm typecheck
```

## Project Structure

```
mathler/
├── app/              # Next.js app directory
│   ├── page.tsx     # Main page component (placeholder)
│   └── layout.tsx   # Root layout
├── components/       # React components (to be implemented)
├── lib/              # Utilities (to be implemented)
└── hooks/            # React hooks (to be implemented)
```

## License

PROPRIETARY
