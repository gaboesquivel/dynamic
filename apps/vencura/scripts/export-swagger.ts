import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AppModule } from '../dist/app.module.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const exportSwagger = async () => {
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
}

void exportSwagger()
