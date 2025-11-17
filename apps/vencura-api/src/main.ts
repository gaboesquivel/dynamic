import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { initSentry } from './config/sentry.config'
import { SentryExceptionFilter } from './filters/sentry-exception.filter'

async function bootstrap() {
  // Initialize Sentry before creating NestJS app
  initSentry()

  const app = await NestFactory.create(AppModule)

  // Add Sentry exception filter globally
  app.useGlobalFilters(new SentryExceptionFilter())

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )

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

  // IMPORTANT: Swagger UI must ALWAYS be enabled - never disable this in any environment
  // Swagger is accessible at /api endpoint and should work in all environments including Vercel
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })

  const port = process.env.PORT || 3077
  await app.listen(port)
  console.log(`Application is running on: http://localhost:${port}`)
  console.log(`Swagger UI is available at: http://localhost:${port}/api`)
  console.log(`Swagger JSON is available at: http://localhost:${port}/api-json`)
}
void bootstrap()
