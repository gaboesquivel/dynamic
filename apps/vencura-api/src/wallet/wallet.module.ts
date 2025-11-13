import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { WalletController } from './wallet.controller'
import { WalletContractController } from './wallet.contract.controller'
import { WalletService } from './wallet.service'
import { EncryptionService } from '../common/encryption.service'
import { WalletClientFactory } from './clients/wallet-client-factory'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [WalletController, WalletContractController],
  providers: [WalletService, EncryptionService, WalletClientFactory],
})
export class WalletModule {}
