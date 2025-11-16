import { Controller, Post, Get, Body, UseGuards, Res, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { Response } from 'express'
import { ChatService } from './chat.service'
import { ChatRequestDto } from './dto/chat.dto'
import { AuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@ApiTags('chat')
@Controller('chat')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @ApiOperation({ summary: 'Chat with AI assistant for wallet operations' })
  @ApiResponse({ status: 200, description: 'Chat response stream' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async chat(
    @CurrentUser() user: { id: string; email: string },
    @Body() chatRequest: ChatRequestDto,
    @Res() res: Response,
  ) {
    const shouldStream = chatRequest.stream !== false

    if (shouldStream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await this.chatService.streamChat(chatRequest.messages, user.id, chatRequest)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      for await (const chunk of result.textStream) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const finishReason = await result.finishReason
      res.write(`data: ${JSON.stringify({ finishReason })}\n\n`)
      res.write('data: [DONE]\n\n')
      res.end()
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = this.chatService.streamChat(chatRequest.messages, user.id, chatRequest)
      let fullText = ''

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      for await (const chunk of result.textStream) {
        fullText += String(chunk)
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const finishReason = await result.finishReason

      res.json({
        message: {
          role: 'assistant' as const,
          content: fullText,
        },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        finishReason,
      })
    }
  }

  @Get('tools')
  @ApiOperation({ summary: 'Get available tools for the chat' })
  @ApiResponse({ status: 200, description: 'List of available tools' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getTools() {
    return this.chatService.getTools()
  }
}
