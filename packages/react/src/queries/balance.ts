import { createQueryKeys } from '@lukemorales/query-key-factory'
import type { BalanceInput } from '@vencura/types'

export const balance = createQueryKeys('balance', {
  detail: (input: BalanceInput) => ({
    queryKey: [input.chainId, input.chainType, input.tokenAddress],
  }),
})
