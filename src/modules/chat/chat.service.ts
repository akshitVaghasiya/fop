// src/chats/chats.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChatFilterDto } from './dto/chat-filter.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { Op } from 'sequelize';
import { Item } from 'src/common/models/item.model';
import { ItemInterests } from 'src/common/models/item-interest.model';
import { Chat } from 'src/common/models/chat.model';
import { AuthUser } from 'src/common/types/auth-user.type';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { User, UserRole } from 'src/common/models/users.model';

interface PageContext {
    page: number;
    limit: number;
    total: number;
}

@Injectable()
export class ChatsService {
    constructor(
        @InjectModel(Item) private readonly itemsModel: typeof Item,
        @InjectModel(ItemInterests) private readonly itemInterestsModel: typeof ItemInterests,
        @InjectModel(Chat) private readonly chatModel: typeof Chat,
    ) { }

    async sendMessage(item_id: string, createDto: CreateChatDto, user: AuthUser): Promise<Chat> {
        try {
            const item = await this.itemsModel.findByPk(item_id);
            if (!item) {
                throw { error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 };
            }
            if (item.type === 'FOUND' && createDto.claim_id) {
                const interest = await this.itemInterestsModel.findOne({
                    where: { id: createDto.claim_id, item_id, user_id: user.id },
                });
                if (!interest) {
                    throw { error: ERROR_MESSAGES.INTEREST_NOT_FOUND, statusCode: 404 };
                }
            }
            if (item.type === 'FOUND' && !createDto.claim_id && user.id !== item.user_id && user.role !== UserRole.ADMIN) {
                throw { error: ERROR_MESSAGES.CLAIM_REQUIRED, statusCode: 403 };
            }
            if (createDto.receiver_id === user.id) {
                throw { error: ERROR_MESSAGES.CANNOT_MESSAGE_SELF, statusCode: 400 };
            }
            const chat = await this.chatModel.create({
                item_id,
                claim_id: createDto.claim_id || null,
                sender_id: user.id,
                receiver_id: createDto.receiver_id,
                message: createDto.message,
            });
            return chat;
        } catch (error) {
            throw error.statusCode
                ? error
                : { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 };
        }
    }

    async getMessages(
        item_id: string,
        claim_id: string | undefined,
        filters: ChatFilterDto,
        user: AuthUser,
    ): Promise<{ messages: Chat[]; page_context: PageContext }> {
        try {
            const { page = 1, limit = 10 } = filters;
            const item = await this.itemsModel.findByPk(item_id);
            if (!item) {
                throw { error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 };
            }
            if (user.role !== UserRole.ADMIN && user.id !== item.user_id) {
                const interest = await this.itemInterestsModel.findOne({
                    where: { item_id, user_id: user.id },
                });
                if (!interest || (claim_id && interest.id !== claim_id)) {
                    throw { error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 };
                }
            }
            const where = {
                item_id,
                ...(claim_id && { claim_id }),
                [Op.or]: [{ sender_id: user.id }, { receiver_id: user.id }],
            };
            const { rows, count } = await this.chatModel.findAndCountAll({
                where,
                include: [
                    { model: User, as: 'sender', attributes: { exclude: ['password'] } },
                    { model: User, as: 'receiver', attributes: { exclude: ['password'] } },
                ],
                order: [['created_at', 'ASC']],
                offset: (page - 1) * limit,
                limit,
            });
            const page_context: PageContext = {
                page,
                limit,
                total: count,
            };
            return { messages: rows, page_context };
        } catch (error) {
            throw error.statusCode
                ? error
                : { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 };
        }
    }
}