'use client'

import { useDynamicContext, getAuthToken } from '@dynamic-labs/sdk-react-core'
import { DynamicWidget } from '@/lib/dynamic'
import { Button } from '@workspace/ui/components/button'
import { WalletDashboard } from '@/components/wallet-dashboard'
import { ChatSidebar } from '@/components/chat-sidebar'
import { useSetState } from 'react-use'
import * as React from 'react'

interface PageState {
  showToken: boolean
  copied: boolean
  authToken: string | null
}

export default function Page() {
  const { user } = useDynamicContext()
  const [state, setState] = useSetState<PageState>({
    showToken: false,
    copied: false,
    authToken: null,
  })

  // Update token when authentication state changes
  React.useEffect(() => {
    if (user) {
      setState({ authToken: getAuthToken() || null })
    } else {
      setState({ authToken: null })
    }
  }, [user, setState])

  const handleCopyToken = async () => {
    const token = getAuthToken()
    if (token) {
      try {
        await navigator.clipboard.writeText(token)
        setState({ copied: true })
        setTimeout(() => setState({ copied: false }), 2000)
      } catch (err) {
        console.error('Failed to copy token:', err)
        setState({ copied: false })
      }
    }
  }

  return (
    <div className="min-h-svh p-4 md:p-8">
      <ChatSidebar />
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Vencura</h1>
          <DynamicWidget />
        </div>

        {!user ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <h2 className="text-2xl font-semibold">Welcome to Vencura</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Please sign in with Dynamic to create and manage your custodial wallets.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">User Info</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setState({ showToken: !state.showToken })}
                >
                  {state.showToken ? 'Hide' : 'Show'} Auth Token
                </Button>
              </div>
              {user ? (
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Email:</span> {user.email || 'N/A'}
                  </p>
                  {user.userId ? (
                    <p>
                      <span className="text-muted-foreground">User ID:</span> {user.userId}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {state.showToken ? (
                <div className="mt-4 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={state.authToken || ''}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md text-xs font-mono bg-muted"
                    />
                    <Button onClick={handleCopyToken} size="sm" variant="outline">
                      {state.copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Copy this token to use in Swagger UI for API testing
                  </p>
                </div>
              ) : null}
            </div>

            <WalletDashboard />
          </div>
        )}
      </div>
    </div>
  )
}
