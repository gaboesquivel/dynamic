// Load environment files before other imports
import './lib/load-env'

import { Elysia } from 'elysia'
import { helloRoute } from './routes/hello'
import { walletRoute } from './routes/wallet'
import { balanceRoute } from './routes/balance'
import { chatRoute } from './routes/chat'
import { zEnv } from './lib/env'

const app = new Elysia()
  .use(helloRoute)
  .use(walletRoute)
  .use(balanceRoute)
  .use(chatRoute)
  .listen(zEnv.PORT)

console.log(`🚀 Server is running on http://localhost:${app.server?.port}`)
