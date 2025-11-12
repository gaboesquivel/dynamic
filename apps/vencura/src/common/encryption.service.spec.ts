import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { EncryptionService } from './encryption.service'

describe('EncryptionService', () => {
  let service: EncryptionService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'encryption.key') {
                return 'test-encryption-key-32-chars-minimum'
              }
              return null
            }),
          },
        },
      ],
    }).compile()

    service = module.get<EncryptionService>(EncryptionService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should encrypt and decrypt text', async () => {
    const originalText = 'test-private-key-0x1234567890abcdef'
    const encrypted = await service.encrypt(originalText)
    expect(encrypted).toBeDefined()
    expect(encrypted).not.toBe(originalText)

    const decrypted = await service.decrypt(encrypted)
    expect(decrypted).toBe(originalText)
  })
})
