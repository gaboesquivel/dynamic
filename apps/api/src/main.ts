import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import helmet from 'helmet'
import { Request, Response, NextFunction } from 'express'
import { AppModule } from './app.module'
import { initSentry } from './config/sentry.config'
import { SentryExceptionFilter } from './filters/sentry-exception.filter'
import { RequestIdMiddleware } from './common/request-id.middleware'
import { validateEnv } from './config/env.schema'

async function bootstrap(): Promise<void> {
  // Initialize Sentry before creating NestJS app
  initSentry()

  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: false,
  })

  // Configure body parser limits (10kb for JSON and URL-encoded)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.headers['content-length']) {
      const contentLength = parseInt(req.headers['content-length'], 10)
      if (contentLength > 10 * 1024) {
        return res.status(413).json({
          statusCode: 413,
          message: 'Payload too large. Maximum size is 10kb.',
        })
      }
    }
    next()
  })

  // Security headers using helmet
  app.use(
    helmet({
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      xFrameOptions: { action: 'deny' },
      xContentTypeOptions: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  )

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })

  // Request ID middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const middleware = new RequestIdMiddleware()
    middleware.use(req, res, next)
  })

  // Add Sentry exception filter globally
  app.useGlobalFilters(new SentryExceptionFilter())

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )

  // Validate environment variables
  const validatedEnv = validateEnv()

  // Swagger UI setup (conditional based on feature flag)
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

  // Only setup Swagger UI if feature flag is enabled (default: false for security)
  if (validatedEnv.ENABLE_SWAGGER_UI === true) {
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  }

  const port = validatedEnv.PORT ?? 3077
  await app.listen(port)
  console.log(`Application is running on: http://localhost:${port}`)
  if (validatedEnv.ENABLE_SWAGGER_UI === true) {
    console.log(`Swagger UI is available at: http://localhost:${port}/api`)
    console.log(`Swagger JSON is available at: http://localhost:${port}/api-json`)
  }
}
void bootstrap()
