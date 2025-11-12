import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import jwt from 'jsonwebtoken'

jest.mock('jsonwebtoken')

describe('AuthService', () => {
  let service: AuthService
  let mockDb: any

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockResolvedValue(undefined),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
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
        {
          provide: 'DATABASE',
          useValue: mockDb,
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should verify token and create user if not exists', async () => {
    const mockDecoded = {
      sub: 'user-123',
      email: 'test@example.com',
    }

    ;(jwt.verify as jest.Mock) = jest.fn().mockReturnValue(mockDecoded)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        key: { publicKey: Buffer.from('test-public-key').toString('base64') },
      }),
    })

    mockDb.limit.mockResolvedValueOnce([]) // User doesn't exist
    mockDb.values.mockResolvedValueOnce(undefined) // Insert succeeds

    const result = await service.verifyToken('test-token')

    expect(result).toEqual({
      id: 'user-123',
      email: 'test@example.com',
    })
  })

  it('should throw UnauthorizedException on invalid token', async () => {
    ;(jwt.verify as jest.Mock) = jest.fn().mockImplementation(() => {
      throw new jwt.JsonWebTokenError('Invalid token')
    })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        key: { publicKey: Buffer.from('test-public-key').toString('base64') },
      }),
    })

    await expect(service.verifyToken('invalid-token')).rejects.toThrow(UnauthorizedException)
  })
})
