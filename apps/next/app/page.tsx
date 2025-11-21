'use client'

import { useHello } from '@vencura/react'
import { DynamicWidget, useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useState } from 'react'

export const dynamic = 'force-dynamic'

export default function Home() {
  const { data, error, isLoading } = useHello()
  const dynamicContext = useDynamicContext()
  const { user } = dynamicContext
  const [copied, setCopied] = useState(false)

  const handleCopyToken = async () => {
    try {
      // Access token through Dynamic SDK context
      // Using type assertion as the exact method may vary by SDK version
      const context = dynamicContext as {
        getAccessToken?: () => string | null
        getAuthToken?: () => string | null
        primaryWallet?: {
          connector?: {
            getAccessToken?: () => string | null
          }
        }
        user?: {
          accessToken?: string
        }
      }
      const token =
        context.getAccessToken?.() ||
        context.getAuthToken?.() ||
        context.primaryWallet?.connector?.getAccessToken?.() ||
        context.user?.accessToken ||
        null

      if (token) {
        await navigator.clipboard.writeText(
          typeof token === 'string' ? token : JSON.stringify(token),
        )
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        alert('JWT token not available. Please check Dynamic SDK documentation for your version.')
      }
    } catch (err) {
      console.error('Failed to copy token:', err)
      alert('Failed to copy token. Check console for details.')
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Hello World Response</h1>
          {isLoading ? <p>Loading...</p> : null}
          {error ? <p className="text-destructive">Error: {error.message}</p> : null}
          {data ? (
            <div className="p-4 border rounded-lg">
              <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Authentication</h2>
          {!user ? (
            <DynamicWidget />
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Logged in as: {user.email || user.username || 'User'}
              </p>
              <button
                onClick={handleCopyToken}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                {copied ? 'Copied!' : 'Copy JWT Token'}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
