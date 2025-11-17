# @vencura/ai

AI chatbot component and SDK for the Vencura wallet platform. Provides an embeddable React component and TypeScript SDK for AI-powered wallet operations.

## Features

- 🤖 **AI-Powered Chat**: Natural language interface for wallet operations
- 🎤 **Voice Input**: Browser-native speech recognition support
- 🔧 **Tool Integration**: Automatic access to wallet operations (create, balance, send, sign)
- 📱 **Mobile-First**: Responsive, fluid design that works anywhere
- 🔌 **Portable**: Works with any React/Next.js app, no vendor lock-in
- 🎨 **AI Elements**: Built with Vercel AI Elements for beautiful UI

## Installation

```bash
pnpm add @vencura/ai
```

## Peer Dependencies

This package requires the following peer dependencies (provided by your app):

- `@vencura/core` - Vencura API client
- `@vencura/react` - VencuraProvider wrapper
- `@dynamic-labs/sdk-react-core` - Dynamic authentication
- `react` ^19.0.0
- `react-dom` ^19.0.0

## Setup

### 1. Wrap Your App with Providers

The chatbot requires both `VencuraProvider` and `DynamicContextProvider`:

```tsx
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { VencuraProvider } from '@vencura/react'
import { Chatbot } from '@vencura/ai'

function App() {
  return (
    <DynamicContextProvider settings={{ environmentId: '...' }}>
      <VencuraProvider baseUrl="https://api.vencura.com" headers={headers}>
        <Chatbot />
      </VencuraProvider>
    </DynamicContextProvider>
  )
}
```

### 2. Use the Chatbot Component

```tsx
import { Chatbot } from '@vencura/ai'

function MyPage() {
  return (
    <div className="h-screen">
      <Chatbot
        baseUrl="https://api.vencura.com"
        defaultModel="gpt-4o-mini"
        showVoiceInput={true}
        maxHeight="100vh"
      />
    </div>
  )
}
```

## Component Props

### `<Chatbot />`

| Prop             | Type      | Default                  | Description                   |
| ---------------- | --------- | ------------------------ | ----------------------------- |
| `baseUrl`        | `string`  | `window.location.origin` | Base URL for the API          |
| `defaultModel`   | `string`  | `'gpt-4o-mini'`          | OpenAI model to use           |
| `showVoiceInput` | `boolean` | `true`                   | Show voice input button       |
| `maxHeight`      | `string`  | `'100vh'`                | Maximum height of the chatbot |
| `className`      | `string`  | -                        | Additional CSS classes        |

## TypeScript SDK

For programmatic access without UI:

```typescript
import { ChatbotSDK } from '@vencura/ai/sdk'

const sdk = new ChatbotSDK({
  baseUrl: 'https://api.vencura.com',
  headers: { Authorization: 'Bearer token' },
})

// Send a message
const response = await sdk.chat([{ role: 'user', content: 'List my wallets' }])

// Stream responses
for await (const delta of sdk.streamChat([
  { role: 'user', content: 'Create a wallet on Arbitrum' },
])) {
  console.log(delta.content)
}

// Get available tools
const tools = await sdk.getTools()
```

## Hooks

### `useChatbot`

React hook for chatbot functionality:

```tsx
import { useChatbot } from '@vencura/ai'

function MyComponent() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChatbot({
    baseUrl: 'https://api.vencura.com',
    model: 'gpt-4o-mini',
  })

  return (
    <form onSubmit={handleSubmit}>
      <input value={input} onChange={handleInputChange} />
      <button type="submit" disabled={isLoading}>
        Send
      </button>
    </form>
  )
}
```

### `useVoiceInput`

React hook for voice input:

```tsx
import { useVoiceInput } from '@vencura/ai'

function VoiceButton() {
  const { isListening, toggleListening, transcript, supported } = useVoiceInput({
    onTranscript: text => console.log(text),
  })

  if (!supported) return null

  return <button onClick={toggleListening}>{isListening ? 'Stop' : 'Start'} Recording</button>
}
```

## Available Tools

The chatbot has access to these wallet operations:

- **getWallets** - List all user wallets
- **createWallet** - Create a new wallet on any supported chain
- **getBalance** - Get wallet balance
- **sendTransaction** - Send a transaction
- **signMessage** - Sign a message

## Portability

This package is designed for maximum portability:

- ✅ Works with any React/Next.js app
- ✅ No vendor lock-in (NestJS backend can deploy anywhere)
- ✅ Standard SSE streaming (works on GCP, AWS, Fly.io, self-hosted)
- ✅ Provider-agnostic AI SDK usage
- ✅ Peer dependencies keep bundle size small

## Examples

### Sidebar Integration

```tsx
import { Chatbot } from '@vencura/ai'
import { Sheet, SheetContent, SheetTrigger } from '@workspace/ui/components/sheet'

function SidebarChat() {
  return (
    <Sheet defaultOpen>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <Chatbot className="h-full" />
      </SheetContent>
    </Sheet>
  )
}
```

### Modal Integration

```tsx
import { Chatbot } from '@vencura/ai'
import { Dialog, DialogContent } from '@workspace/ui/components/dialog'

function ModalChat({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] p-0">
        <Chatbot className="h-full" />
      </DialogContent>
    </Dialog>
  )
}
```

## Authentication

The chatbot requires Dynamic Labs authentication. Users must be signed in to use the chatbot. The component automatically handles authentication state and shows a message if the user is not authenticated.

## License

PROPRIETARY
