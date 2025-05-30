import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ChatFilterDto } from './dto/chat-filter.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatsService } from './chat.service';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request.type';
import { Chat } from 'src/common/models/chat.model';
import { GlobalHttpException } from 'src/common/exceptions/global-exception';
import { PermissionGuard } from 'src/common/guards/roles/permission.guard';

@ApiTags('Chats')
@ApiBearerAuth()
// @Roles(UserRole.ADMIN, UserRole.USER)
@Controller('chats')
export class ChatsController {
    constructor(private readonly chatsService: ChatsService) { }

    @Post(':item_id/messages')
    @Roles('chat_create')
    @UseGuards(PermissionGuard)
    @ApiOperation({ summary: 'Send a chat message for an item' })
    @ApiParam({ name: 'item_id', description: 'UUID of the item' })
    @ApiResponse({ status: 201, description: 'Message sent', type: Chat })
    @ApiResponse({ status: 403, description: 'Forbidden (e.g., no claim)' })
    async sendMessage(
        @Param('item_id', ParseUUIDPipe) item_id: string,
        @Req() req: AuthenticatedRequest,
        @Body() createDto: CreateChatDto,
    ): Promise<Chat> {
        try {
            return await this.chatsService.create(item_id, createDto, req.user);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Get(':item_id/messages')
    @Roles('chat_messages')
    @UseGuards(PermissionGuard)
    @ApiOperation({ summary: 'Get chat messages for an item' })
    @ApiParam({ name: 'item_id', description: 'UUID of the item' })
    @ApiQuery({ name: 'item_interest_id', description: 'UUID of the claim (optional)', required: false })
    @ApiQuery({ name: 'filters', description: 'Filters for messages', type: ChatFilterDto })
    @ApiResponse({ status: 200, description: 'List of messages', type: [Chat] })
    async getMessages(
        @Param('item_id', ParseUUIDPipe) item_id: string,
        @Query('item_interest_id', new ParseUUIDPipe({ optional: true })) item_interest_id: string | undefined,
        @Query() filters: ChatFilterDto,
        @Req() req: AuthenticatedRequest,
    ): Promise<{ messages: Chat[]; page_context: any }> {
        try {
            return await this.chatsService.findAll(item_id, item_interest_id, filters, req.user);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }
}