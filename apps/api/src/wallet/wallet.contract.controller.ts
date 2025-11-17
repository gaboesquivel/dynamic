import { Controller, UseGuards, Req } from '@nestjs/common'
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest'
import { walletAPIContract } from '@vencura/types'
import type { CreateWalletInput, SendTransactionInput, SignMessageInput } from '@vencura/types'
import { WalletService } from './wallet.service'
import { AuthGuard } from '../auth/auth.guard'
import type { Request } from 'express'

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string }
}

@Controller()
@UseGuards(AuthGuard)
export class WalletContractController {
  constructor(private readonly walletService: WalletService) {}

  @TsRestHandler(walletAPIContract)
  handler(@Req() req: AuthenticatedRequest) {
    return tsRestHandler(walletAPIContract, {
      list: async () => {
        const user = req.user
        const wallets = await this.walletService.getUserWallets(user.id)
        return {
          status: 200 as const,
          body: wallets,
        }
      },
      create: async ({ body }: { body: CreateWalletInput }) => {
        const user = req.user

        const wallet = await this.walletService.createWallet(user.id, body.chainId)
        return {
          status: 201 as const,
          body: wallet,
        }
      },
      getBalance: async ({ params }: { params: { id: string } }) => {
        const user = req.user
        const { id } = params

        const balance = await this.walletService.getBalance(id, user.id)
        return {
          status: 200 as const,
          body: balance,
        }
      },
      signMessage: async ({ params, body }: { params: { id: string }; body: SignMessageInput }) => {
        const user = req.user
        const { id } = params

        const { message } = body

        const result = await this.walletService.signMessage(id, user.id, message)
        return {
          status: 200 as const,
          body: result,
        }
      },
      sendTransaction: async ({
        params,
        body,
      }: {
        params: { id: string }
        body: SendTransactionInput
      }) => {
        const user = req.user
        const { id } = params

        const { to, amount } = body

        const result = await this.walletService.sendTransaction(id, user.id, to, amount)
        return {
          status: 200 as const,
          body: result,
        }
      },
    })
  }
}
