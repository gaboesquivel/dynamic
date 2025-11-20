import { Global, Module } from '@nestjs/common'
import { RateLimitService } from './rate-limit.service'
import { LoggerModule } from './logger/logger.module'

@Global()
@Module({
  imports: [LoggerModule],
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class CommonModule {}
