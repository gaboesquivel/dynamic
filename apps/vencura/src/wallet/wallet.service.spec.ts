import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { EncryptionService } from '../common/encryption.service';

describe('WalletService', () => {
  let service: WalletService;
  let mockDb: any;
  let mockEncryptionService: jest.Mocked<EncryptionService>;

  beforeEach(async () => {
    mockDb = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockResolvedValue(undefined),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };

    mockEncryptionService = {
      encrypt: jest.fn().mockResolvedValue('encrypted-key'),
      decrypt: jest.fn().mockResolvedValue('0x1234567890abcdef'),
    } as any;

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
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'blockchain.rpcUrl') {
                return 'https://arbitrum-sepolia.infura.io/v3/test';
              }
              if (key === 'dynamic.environmentId') {
                return 'test-env-id';
              }
              if (key === 'dynamic.apiToken') {
                return 'test-api-token';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a wallet', async () => {
    const result = await service.createWallet('user-123', 'arbitrum-sepolia');

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('address');
    expect(result).toHaveProperty('network', 'arbitrum-sepolia');
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockEncryptionService.encrypt).toHaveBeenCalled();
  });

  it('should throw NotFoundException when wallet not found', async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    await expect(service.getBalance('wallet-123', 'user-123')).rejects.toThrow(
      NotFoundException,
    );
  });
});
