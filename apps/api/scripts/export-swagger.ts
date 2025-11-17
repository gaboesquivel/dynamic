// Handle errors before any imports to catch module loading errors
process.on('unhandledRejection', (reason, promise) => {
  console.warn('Swagger export failed, but continuing build...')
  process.exit(0)
})

process.on('uncaughtException', error => {
  console.warn('Swagger export failed, but continuing build...')
  process.exit(0)
})

// Set exit code to 0 on any error to prevent build failure
const originalExit = process.exit
process.exit = (code?: number) => {
  originalExit(0)
}

import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)

const exportSwagger = async () => {
  try {
    // Check if dist directory and app.module.js exist
    const appModulePath = join(__dirname, '../dist/app.module.js')
    if (!existsSync(appModulePath)) {
      console.warn(
        `Swagger export skipped: ${appModulePath} not found. Build may not have completed successfully.`,
      )
      process.exit(0)
    }

    // Use require for CommonJS compatibility with compiled NestJS modules
    // Wrap in try-catch to handle module loading errors gracefully
    let AppModule
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      AppModule = require('../dist/app.module.js').AppModule
    } catch (requireError) {
      const errorMessage =
        requireError instanceof Error ? requireError.message : String(requireError)
      console.error('Failed to load AppModule:', errorMessage)
      console.warn('Swagger export failed, but continuing build...')
      process.exit(0)
    }

    const app = await NestFactory.create(AppModule, { logger: false })

    const config = new DocumentBuilder()
      .setTitle('Vencura API')
      .setDescription(
        'Custodial wallet API for Vencura. Get your authentication token from the vencura-ui frontend after logging in with Dynamic, then paste it here.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Get token from vencura-ui frontend after Dynamic login, then paste here',
          in: 'header',
        },
        'JWT-auth',
      )
      .build()

    const document = SwaggerModule.createDocument(app, config)
    const outputPath = join(__dirname, '../dist/swagger.json')
    writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf-8')

    await app.close()
    console.log(`Swagger JSON exported to: ${outputPath}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error exporting Swagger:', errorMessage)
    if (error instanceof Error && error.stack) {
      console.error(error.stack)
    }
    // Don't fail the build if swagger export fails - it's optional
    console.warn('Swagger export failed, but continuing build...')
    process.exit(0)
  }
}

exportSwagger()
  .then(() => {
    // Success - script will exit naturally
  })
  .catch(error => {
    console.error('Failed to export Swagger:', error)
    if (error instanceof Error && error.stack) {
      console.error(error.stack)
    }
    // Don't fail the build if swagger export fails - it's optional
    console.warn('Swagger export failed, but continuing build...')
    process.exit(0)
  })
