# Mathler

A Mathler game built with Next.js - like Wordle but with numbers. Users have 6 guesses to find the equation that equals a daily number.

## Current Status

✅ **Game engine fully implemented** - The core game logic, equation generation, validation, and feedback systems are complete and functional.

## Features

- ✅ Daily puzzles with changing target numbers
- ✅ Dynamic SDK integration for authentication
- ✅ User history stored in Dynamic metadata
- ✅ Color-coded feedback (green/yellow/grey tiles)
- ✅ Order of operations support
- ✅ Keyboard and mouse controls
- ✅ Voice input support
- ✅ Responsive UI/UX design
- 🔜 Crypto-related features (NFT minting, token rewards, etc.)

## Tech Stack

- Next.js 16.0.0
- React 19.1.1
- TypeScript
- Dynamic SDK
- Tailwind CSS
- Shadcn/ui components (via `@vencura/ui`)
- react-error-boundary for error handling
- zod-validation-error for better validation error messages

## Design System & Dependencies

This app uses `@vencura/ui` as the centralized design system:

- **UI Components**: Import from `@vencura/ui/components/*`
- **Radix Primitives**: Import from `@vencura/ui/radix`
- **Utilities**: Import from `@vencura/ui/lib/utils`
- **Icons**: Import from `lucide-react` via `@vencura/ui`

**Do NOT install** these design system dependencies directly in this app - they are managed centrally in `@vencura/ui`:

- Any `@radix-ui/react-*` packages
- `class-variance-authority`, `clsx`, `tailwind-merge`

**Do install** these app-level dependencies:

- `next-themes` - Theme provider (configured per app)
- `lucide-react` - If you need icons directly (UI components already include it)

## Mobile-First Design

This app follows **mobile-first responsive design**:

- Base styles target mobile devices (default)
- Enhancements added for larger screens using Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)
- All components are designed mobile-first, then enhanced for desktop

See [Mobile-First Rules](../../.cursor/rules/frontend/mobile-first.mdc) for detailed guidelines.

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

This Next.js app uses environment-specific configuration files. Next.js automatically loads environment files in priority order:

1. `.env` (highest priority, sensitive data, never committed, overrides everything)
2. `.env.development` / `.env.staging` / `.env.production` (based on NODE_ENV, committed configs)

**File Structure:**

- `.env` - Sensitive data (API keys, tokens, secrets) - **NEVER COMMIT**
- `.env.development` - Development configuration (committed, non-sensitive)
- `.env.staging` - Staging configuration (committed, non-sensitive)
- `.env.production` - Production configuration (committed, non-sensitive)
- `.env-example` - Template for `.env` file (shows required sensitive variables)

**Setup for Local Development:**

```bash
# Copy the example file for sensitive data
cp .env-example .env

# Fill in your actual sensitive values in .env
# NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id

# .env.development is already committed with non-sensitive configs
```

**Required Environment Variables:**

- `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`: Your Dynamic environment ID from the [Dynamic Dashboard](https://app.dynamic.xyz/). Required for authentication to work properly.

**Optional Environment Variables:**

- `NEXT_PUBLIC_SENTRY_DSN`: Sentry DSN URL for error tracking (optional, defaults to disabled)
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT`: Environment name for Sentry (optional, defaults to `NODE_ENV`)

**Environment-Specific Configuration:**

- **Development** (`.env.development` + `.env`): Local development
- **Staging** (`.env.staging` + `.env`): Staging environment
- **Production** (`.env.production` + `.env`): Production environment

**Note**: `.env.development`, `.env.staging`, and `.env.production` are committed files with non-sensitive configuration. Sensitive data (like `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`) should be in `.env` file (never committed).

**Getting Your Dynamic Environment ID:**

1. Go to [app.dynamic.xyz](https://app.dynamic.xyz/)
2. Sign up for a free account (if you don't have one)
3. Create a new project or select an existing one
4. Copy the Environment ID from your project settings
5. Add it to your `.env.local` file as `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`

**Note**: If `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` is not set, the app will use a placeholder ID and show warnings in development mode. Authentication will not work properly without a valid environment ID.

See [Environment Strategy](../../docs/environment-strategy.md) for detailed configuration instructions.

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

## Testing

### Unit Tests

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov
```

### E2E Tests

E2E tests use Playwright to test the application in a real browser environment.

```bash
# Run e2e tests (builds and starts the app automatically)
pnpm test:e2e

# Run e2e tests with UI mode (interactive)
pnpm test:e2e:ui

# Run e2e tests in debug mode
pnpm test:e2e:debug
```

**E2E Test Coverage:**

- Page loading and hydration
- Game UI rendering (header, game board, keypad)
- User interactions (keypad input, submit, backspace)
- Responsive design on mobile viewports
- Error handling and console error detection

**Note**: E2E tests require the app to be built. The test runner will automatically build and start the production server before running tests.

## Game Engine Documentation

### Game Rules & Constraints

Mathler is a daily puzzle game where players have **6 guesses** to find the equation that equals a target number.

#### Core Rules

1. **Target Number**: Each puzzle has a target number between 10-100, generated deterministically based on the date
2. **Maximum Guesses**: Players have exactly 6 attempts to find the solution
3. **Equation Length**: Solutions are always ≤ 9 characters (including operators and parentheses)
4. **Win Condition**: To win, the guess must:
   - Evaluate to the target number
   - Match the solution equation exactly (character-for-character)

#### Expression Constraints

Valid expressions must follow these rules:

- **Operators**: Only `+`, `-`, `*`, `/` are allowed (Unicode variants `×` and `÷` are normalized)
- **Numbers**: Only positive integers (no decimals, no negative numbers)
- **No Leading Zeros**: Expressions like `01+2` or `03*5` are invalid
- **No Leading/Trailing Operators**: Cannot start with `+`, `-`, `*`, `/` or end with any operator
- **No Consecutive Operators**: Patterns like `++`, `**`, `//` are invalid
- **No Unary Minus**: Expressions cannot start with `-` (e.g., `-3+4` is invalid)
- **Integer Division Only**: Division operations must result in whole numbers (e.g., `8/2` is valid, `7/2` is invalid)
- **No Division by Zero**: Division by zero is rejected
- **Parentheses Support**: Parentheses can be used for grouping (e.g., `(2+3)*4`)

#### Order of Operations

Expressions follow standard mathematical order of operations (PEDMAS):

1. **P**arentheses
2. **E**xponents (not supported)
3. **D**ivision and **M**ultiplication (left-to-right)
4. **A**ddition and **S**ubtraction (left-to-right)

Examples:

- `2+3*4` = `2+(3*4)` = `14` (not `20`)
- `10/2+3` = `(10/2)+3` = `8` (not `2`)
- `(2+3)*4` = `20` (parentheses override precedence)

### Validation Logic

The game uses a multi-layer validation approach:

#### 1. Character Set Validation

- Regex check: `/^[\d+\-*/.()]+$/` ensures only valid characters
- Rejects any non-numeric, non-operator characters

#### 2. Syntax Validation

- **Leading/Trailing Operators**: Rejects expressions starting with `+`, `-`, `*`, `/` or ending with any operator
- **Consecutive Operators**: Rejects patterns like `++`, `**`, `//`, `*/`, etc.
- **Leading Zeros**: Explicit check `/\b0\d/` rejects numbers with leading zeros (e.g., `01`, `02`)

#### 3. Expression Evaluation

- Uses `expr-eval` parser (restricted to basic arithmetic only)
- Parser handles operator precedence automatically
- Results rounded to 6 decimal places to avoid floating-point precision issues
- Returns `null` for invalid expressions or non-finite results

#### 4. Result Validation

- Checks if result is a finite number
- Validates that the expression evaluates correctly

### Equation Generation Strategy

The game engine generates valid equations using a two-phase approach:

#### Phase 1: Two-Number Equations

Generates simple equations of the form `a op b = target`:

- Iterates through all combinations of numbers (1-99) and operators
- Validates operations using operator guards:
  - **Addition**: Always valid
  - **Subtraction**: Only when `a > b` (avoids negative results)
  - **Multiplication**: Always valid
  - **Division**: Only when `b ≠ 0` and `a` is divisible by `b` (integer results)
- Filters equations that exceed the 9-character limit

**Examples**: `5+10=15`, `20-5=15`, `3*5=15`, `30/2=15`

#### Phase 2: Three-Number Equations with Order of Operations

Generates equations with three numbers considering operator precedence:

**Left-Associative**: `(a op1 b) op2 c`

- Example: `(2+3)*4` evaluates as `(5)*4 = 20`
- Parentheses added when:
  - `op2` has higher precedence than `op1` (e.g., `(2+3)*4`)
  - Equal precedence but non-commutative (e.g., `(10-2)/2`)

**Right-Associative**: `a op1 (b op2 c)`

- Example: `2+(3*4)` evaluates as `2+(12) = 14`
- Parentheses added when `op2` has lower precedence than `op1`
- Example: `2+(3*4)` needs parens, but `2*(3+4)` doesn't (due to precedence)

#### Selection Strategy

1. **Candidate Collection**: All valid equations collected in a `Set` (automatic deduplication)
2. **Seeded Random Selection**: Uses date-based seed combined with target number for daily consistency
3. **Fallback**: Returns `target+0` if no valid equations found (shouldn't happen in practice)

#### Daily Consistency

- Uses date-based seeding: `YYYYMMDD` format
- Same date + same target = same equation for all players
- Ensures fair, consistent daily puzzles

### Feedback Calculation Algorithm (Wordle-style)

The game uses a two-pass algorithm to calculate feedback for each guess:

#### Feedback States

- **`correct`** (Green): Character is in the correct position
- **`present`** (Yellow): Character exists in solution but in wrong position
- **`absent`** (Grey): Character does not exist in solution

#### Algorithm Steps

**Pass 1: Mark Correct Positions**

```typescript
for each position i:
  if guess[i] === solution[i]:
    feedback[i] = 'correct'
```

**Pass 2: Mark Present Characters**

1. Create working copies of solution and guess characters
2. Remove characters already marked as `correct` from consideration
3. For each remaining character in guess:
   - If character exists in remaining solution characters:
     - Mark as `present`
     - Remove that character from solution (to avoid double-counting)

**Example**:

- Solution: `"2+3*4"`
- Guess: `"2*3+4"`
- Result: `["correct", "present", "present", "present", "correct"]`
  - Position 0: `'2'` is correct
  - Position 1: `'*'` is present (exists in solution at position 2)
  - Position 2: `'3'` is present (exists in solution at position 1)
  - Position 3: `'+'` is present (exists in solution at position 1)
  - Position 4: `'4'` is correct

#### Important Notes

- Characters are matched position-by-position for `correct`
- Each solution character can only match one guess character
- Once a character is marked `correct`, it's excluded from `present` matching
- This prevents double-counting of repeated characters

### Complete Game Flow

#### 1. Initialization

When the game starts or resets:

```typescript
1. Generate target number (10-100) using date-based seeded random
2. Generate solution equation for target using generateSolutionEquation()
3. Initialize game state:
   - target: generated target number
   - solution: generated equation string
   - guesses: empty array
   - gameStatus: 'playing'
   - feedback: empty array
4. Reset input field and cursor position
```

#### 2. Input Phase

Players can input guesses through multiple methods:

- **Keyboard**: Type numbers and operators directly
- **On-screen Keypad**: Click buttons to input characters
- **Voice Input**: Speak numbers and operators (parsed and inserted)
- **Cursor Navigation**: Click tiles or use arrow keys to move cursor

**Input Constraints**:

- Maximum length: 9 characters
- Only valid characters accepted (digits, operators, parentheses)
- Invalid characters are rejected

#### 3. Submission Phase

When player submits a guess:

```typescript
1. Validate expression:
   - Check character set
   - Check syntax (no leading zeros, no consecutive operators, etc.)
   - Evaluate expression using parser
   - Return null if invalid → show error alert

2. If valid:
   - Normalize guess (× → *, ÷ → /)
   - Calculate feedback using calculateFeedback()
   - Add guess to guesses array
   - Add feedback to feedback array

3. Check win condition:
   - result === target AND normalizedGuess === solution
   - If win: set gameStatus to 'won', show success modal
   - If loss: check if guesses.length >= 6, set to 'lost'

4. If game over:
   - Save game history to Dynamic metadata
   - Include: date, target, solution, guesses, status, guessCount
```

#### 4. Feedback Display

After each guess:

- Each character in the guess row displays color-coded feedback:
  - **Green tile**: Character is correct (right character, right position)
  - **Yellow tile**: Character is present (right character, wrong position)
  - **Grey tile**: Character is absent (not in solution)
- Previous guesses remain visible with their feedback
- Current input row shows live typing

#### 5. Win Condition

Player wins when:

- The guess evaluates to the target number **AND**
- The guess matches the solution equation exactly (character-for-character)

**Example**:

- Target: `15`
- Solution: `"5+10"`
- Valid winning guesses: `"5+10"` ✅
- Invalid (evaluates correctly but wrong equation): `"3*5"` ❌ (evaluates to 15 but doesn't match solution)

#### 6. Loss Condition

Player loses when:

- 6 guesses have been made without finding the solution
- Game status changes to `'lost'`
- Solution is revealed

#### 7. Game History

When a game ends (win or loss):

- Game data is saved to Dynamic user metadata:
  - Date (YYYY-MM-DD format)
  - Target number
  - Solution equation
  - All guesses made
  - Final status (`'won'` or `'lost'`)
  - Number of guesses used
  - Completion timestamp
- History persists across sessions
- Users can view their game statistics

#### 8. Reset Flow

When player clicks "Play Again" or game resets:

- New target number generated (based on new date if day changed)
- New solution equation generated for new target
- All game state reset to initial values
- Input field cleared
- Ready for new game

### Technical Implementation Details

#### Key Files

- **`lib/math-utils.ts`**: Expression evaluation, equation generation, validation
- **`lib/feedback-utils.ts`**: Wordle-style feedback calculation
- **`components/mathler-game.tsx`**: Main game component, state management
- **`hooks/use-mathler-input.ts`**: Input handling, cursor management, keyboard events
- **`hooks/use-game-history.ts`**: Game history persistence via Dynamic SDK

#### Expression Parser

- Uses `expr-eval` library (restricted to basic arithmetic)
- Singleton parser instance for performance
- All functions and constants disabled for security
- Handles operator precedence automatically
- Supports parentheses for grouping

#### Performance Considerations

- Equation generation happens once per game (on initialization)
- Parser instance reused across evaluations
- Feedback calculation is O(n) where n is equation length
- Game history saved asynchronously (doesn't block UI)

## Project Structure

```
mathler/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main page component
│   └── layout.tsx         # Root layout
├── components/             # React components
│   ├── mathler-game.tsx   # Main game component
│   ├── guess-row.tsx      # Individual guess row display
│   ├── game-keypad.tsx    # On-screen keypad
│   ├── game-status.tsx    # Win/loss status display
│   └── voice-control.tsx  # Voice input component
├── lib/                    # Utilities
│   ├── math-utils.ts      # Expression evaluation & equation generation
│   └── feedback-utils.ts  # Feedback calculation algorithm
├── hooks/                  # React hooks
│   ├── use-mathler-input.ts    # Input handling hook
│   └── use-game-history.ts     # Game history persistence
└── types/                  # TypeScript type definitions
```

## License

PROPRIETARY
