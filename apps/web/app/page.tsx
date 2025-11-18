'use client'

import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { DynamicWidget } from '@/lib/dynamic'
import { Button } from '@vencura/ui/components/button'
import { WalletDashboard } from '@/components/wallet-dashboard'
import { ChatSidebar } from '@/components/chat-sidebar'
import { useSetState } from 'react-use'
import * as React from 'react'

interface PageState {
  showToken: boolean
  copied: boolean
}

export default function Page() {
  const { user } = useDynamicContext()
  const [state, setState] = useSetState<PageState>({
    showToken: false,
    copied: false,
  })

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
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">
                      Auth token is automatically included in API requests via{' '}
                      <code className="text-xs">useVencuraHeaders</code> hook.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      For API testing, use Swagger UI at <code className="text-xs">/api</code> with
                      Dynamic authentication.
                    </p>
                  </div>
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
