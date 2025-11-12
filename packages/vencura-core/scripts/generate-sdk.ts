import { generateApi } from 'swagger-typescript-api'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const waitForFile = async (filePath: string, maxAttempts = 30, delayMs = 1000) => {
  for (let i = 0; i < maxAttempts; i++) {
    if (existsSync(filePath)) {
      console.log(`Found Swagger JSON at: ${filePath}`)
      return
    }
    if (i === 0) console.log(`Waiting for Swagger JSON at: ${filePath}...`)
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  throw new Error(
    `Swagger JSON not found at: ${filePath} after ${maxAttempts} attempts (${maxAttempts * delayMs}ms)`,
  )
}

const generateSdk = async ({
  swaggerJsonPath,
  outputPath,
}: {
  swaggerJsonPath: string
  outputPath: string
}) => {
  await waitForFile(swaggerJsonPath)

  await generateApi({
    name: 'index.ts',
    output: outputPath,
    input: swaggerJsonPath,
    httpClientType: 'fetch',
    generateClient: true,
    generateRouteTypes: true,
    generateResponses: true,
    toJS: false,
    extractRequestParams: true,
    extractRequestBodies: true,
    extractEnums: true,
    unwrapResponseData: false,
    prettier: {
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 100,
      tabWidth: 2,
      semi: false,
      arrowParens: 'avoid',
    },
  })

  console.log(`SDK generated successfully to: ${outputPath}`)
}

const swaggerJsonPath = join(__dirname, '../../../apps/vencura/dist/swagger.json')
const outputPath = join(__dirname, '../src')

void generateSdk({ swaggerJsonPath, outputPath })
