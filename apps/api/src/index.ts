import { Elysia } from 'elysia'
import { helloRoute } from './routes/hello'

const app = new Elysia().use(helloRoute).listen(Number(process.env.PORT) || 3077)

console.log(`🚀 Server is running on http://localhost:${app.server?.port}`)
