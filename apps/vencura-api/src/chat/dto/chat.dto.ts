import {
  IsArray,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant', 'system'] })
  @IsString()
  role!: 'user' | 'assistant' | 'system'

  @ApiProperty()
  @IsString()
  content!: string
}

export class ChatRequestDto {
  @ApiProperty({ type: [ChatMessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[]

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  stream?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number
}
