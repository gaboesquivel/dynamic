// Mock @cosmjs/encoding to avoid ES module issues in Jest
jest.mock('@cosmjs/encoding', () => ({
  fromBech32: jest.fn((address: string) => {
    // Basic mock implementation
    const match = address.match(/^([a-z]{1,5})1([a-z0-9]+)$/i)
    if (!match) throw new Error('Invalid Bech32 address')
    return {
      prefix: match[1],
      data: new Uint8Array(20), // Mock 20-byte data
    }
  }),
}))

import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { WalletService } from './wallet.service'
import { EncryptionService } from '../common/encryption.service'
import { WalletClientFactory } from './clients/wallet-client-factory'
import { BaseWalletClient } from './clients/base-wallet-client'

describe('WalletService', () => {
  let service: WalletService
  let mockDb: any
  let mockEncryptionService: jest.Mocked<EncryptionService>
  let mockWalletClientFactory: jest.Mocked<WalletClientFactory>
  let mockWalletClient: jest.Mocked<BaseWalletClient>

  beforeEach(async () => {
    mockDb = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockResolvedValue(undefined),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    }

    mockEncryptionService = {
      encrypt: jest.fn().mockResolvedValue('encrypted-key'),
      decrypt: jest.fn().mockResolvedValue('["0x123", "0x456"]'),
    } as any

    mockWalletClient = {
      createWallet: jest.fn().mockResolvedValue({
        accountAddress: '0x1234567890abcdef',
        externalServerKeyShares: ['0x123', '0x456'],
      }),
      getBalance: jest.fn().mockResolvedValue({ balance: 1.5 }),
      signMessage: jest.fn().mockResolvedValue({ signedMessage: '0xsigned' }),
      sendTransaction: jest.fn().mockResolvedValue({
        transactionHash: '0xtxhash',
      }),
    } as any

    mockWalletClientFactory = {
      createWalletClient: jest.fn().mockReturnValue(mockWalletClient),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: 'DATABASE',
          useValue: mockDb,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
        {
          provide: WalletClientFactory,
          useValue: mockWalletClientFactory,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'dynamic.environmentId') {
                return 'test-env-id'
              }
              if (key === 'dynamic.apiToken') {
                return 'test-api-token'
              }
              return null
            }),
          },
        },
      ],
    }).compile()

    service = module.get<WalletService>(WalletService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create a wallet with EVM chain ID', async () => {
    const result = await service.createWallet('user-123', 421614)

    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('address')
    expect(result).toHaveProperty('network', '421614')
    expect(result).toHaveProperty('chainType', 'evm')
    expect(mockDb.insert).toHaveBeenCalled()
    expect(mockEncryptionService.encrypt).toHaveBeenCalled()
    expect(mockWalletClient.createWallet).toHaveBeenCalled()
  })

  it('should create a wallet with Solana network ID', async () => {
    const result = await service.createWallet('user-123', 'solana-mainnet')

    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('address')
    expect(result).toHaveProperty('network', 'solana-mainnet')
    expect(result).toHaveProperty('chainType', 'solana')
    expect(mockDb.insert).toHaveBeenCalled()
    expect(mockEncryptionService.encrypt).toHaveBeenCalled()
    expect(mockWalletClient.createWallet).toHaveBeenCalled()
  })

  it('should throw BadRequestException for unsupported chain', async () => {
    mockWalletClientFactory.createWalletClient.mockReturnValueOnce(null)

    await expect(service.createWallet('user-123', 99999)).rejects.toThrow(BadRequestException)
  })

  it('should get user wallets', async () => {
    mockDb.where.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
    })
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([
          {
            id: 'wallet-1',
            address: '0x123',
            network: '421614',
            chainType: 'evm',
          },
        ]),
      }),
    })

    const result = await service.getUserWallets('user-123')

    expect(result).toHaveLength(1)
    expect(result[0]).toHaveProperty('network', '421614')
    expect(result[0]).toHaveProperty('chainType', 'evm')
  })

  it('should throw NotFoundException when wallet not found for balance', async () => {
    mockDb.limit.mockResolvedValueOnce([])

    await expect(service.getBalance('wallet-123', 'user-123')).rejects.toThrow(NotFoundException)
  })

  it('should get balance for EVM wallet', async () => {
    mockDb.limit.mockResolvedValueOnce([
      {
        id: 'wallet-123',
        address: '0x123',
        network: '421614',
        chainType: 'evm',
        privateKeyEncrypted: 'encrypted',
      },
    ])

    const result = await service.getBalance('wallet-123', 'user-123')

    expect(result).toHaveProperty('balance', 1.5)
    expect(mockWalletClient.getBalance).toHaveBeenCalledWith('0x123')
  })

  it('should sign message', async () => {
    mockDb.limit.mockResolvedValueOnce([
      {
        id: 'wallet-123',
        address: '0x123',
        network: '421614',
        chainType: 'evm',
        privateKeyEncrypted: 'encrypted',
      },
    ])

    const result = await service.signMessage('wallet-123', 'user-123', 'Hello World')

    expect(result).toHaveProperty('signedMessage', '0xsigned')
    expect(mockWalletClient.signMessage).toHaveBeenCalled()
  })

  it('should send transaction', async () => {
    mockDb.limit.mockResolvedValueOnce([
      {
        id: 'wallet-123',
        address: '0x123',
        network: '421614',
        chainType: 'evm',
        privateKeyEncrypted: 'encrypted',
      },
    ])

    const result = await service.sendTransaction(
      'wallet-123',
      'user-123',
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      0.1,
    )

    expect(result).toHaveProperty('transactionHash', '0xtxhash')
    expect(mockWalletClient.sendTransaction).toHaveBeenCalled()
  })
})
