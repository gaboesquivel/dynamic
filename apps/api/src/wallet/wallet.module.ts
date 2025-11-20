import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { WalletController } from './wallet.controller'
import { WalletContractController } from './wallet.contract.controller'
import { WalletService } from './wallet.service'
import { EncryptionService } from '../common/encryption.service'
import { WalletClientFactory } from './clients/wallet-client-factory'
import { AuthModule } from '../auth/auth.module'
import { CommonModule } from '../common/common.module'

@Module({
  imports: [ConfigModule, AuthModule, CommonModule],
  controllers: [WalletController, WalletContractController],
  providers: [WalletService, EncryptionService, WalletClientFactory],
  exports: [WalletService],
})
export class WalletModule {}
