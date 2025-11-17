import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthService } from './auth.service'
import { AuthGuard } from './auth.guard'

@Module({
  imports: [ConfigModule],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
