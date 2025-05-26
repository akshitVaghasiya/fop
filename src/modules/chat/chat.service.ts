import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { Chat } from 'src/common/models/chat.model';
import { Item } from 'src/common/models/item.model';
import { User, UserRole } from 'src/common/models/users.model';
import { ItemInterests } from 'src/common/models/item-interest.model';
import { ProfilePermissionService } from '../user-profile-permission/profile-permission.service';
import { AuthUser } from 'src/common/types/auth-user.type';
import { CreateChatDto } from './dto/create-chat.dto';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { ChatFilterDto } from './dto/chat-filter.dto';
import { Op } from 'sequelize';


interface PageContext {
    page: number;
    limit: number;
    total: number;
}
// type PageContext = {
//   page: number;
//   type PageType: number;
//   limit: number;
//   total: number;
//   type total: number;
// };

@Injectable()
export class ChatsService {
    constructor(
        @InjectModel(Chat)
        private readonly chatModel: typeof Chat,
        @InjectModel(Item)
        private readonly itemModel: typeof Item,
        @InjectModel(User)
        private readonly userModel: typeof User,
        @InjectModel(ItemInterests)
        private readonly ItemInterestsModel: typeof ItemInterests,
        private readonly sequelize: Sequelize,
    ) { }

    create(item_id: string, dto: CreateChatDto, user: AuthUser): Promise<Chat> {
        return new Promise(async (resolve, reject) => {
            const transaction = await this.sequelize.transaction();
            try {

                const { claim_id, receiver_id, message, requestProfileView } = dto;

                console.log("dto-->", dto);

                const item = await this.itemModel.findByPk(item_id, { raw: true });
                if (!item) {
                    await transaction.rollback();
                    return reject({ error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 });
                }

                console.log("item-->", item);

                if (item.type === 'FREE') {
                    await transaction.rollback();
                    return reject({ error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 });
                }

                if (item.status !== 'ACTIVE') {
                    await transaction.rollback();
                    return reject({ error: ERROR_MESSAGES.ITEM_NOT_ACTIVE, statusCode: 400 });
                }

                const receiver = await this.userModel.findByPk(receiver_id, { raw: true });
                if (!receiver) {
                    await transaction.rollback();
                    return reject({ error: ERROR_MESSAGES.RECEIVER_USER_NOT_FOUND, statusCode: 404 });
                }

                console.log("receiver-->", receiver);


                if (receiver_id === user.id) {
                    await transaction.rollback();
                    return reject({ error: ERROR_MESSAGES.CANNOT_MESSAGE_SELF, statusCode: 400 });
                }

                console.log("user-->", user);


                let validatedClaimId: string | null = null;
                if (item.type === 'FOUND') {
                    if (!claim_id) {
                        await transaction.rollback();
                        return reject({ error: ERROR_MESSAGES.CLAIM_REQUIRED, statusCode: 400 });
                    }
                    const claim = await this.ItemInterestsModel.findOne({
                        where: { id: claim_id, item_id },
                        attributes: ['id'],
                        raw: true,
                        transaction,
                    });
                    console.log('claim-->', claim);
                    if (!claim) {
                        await transaction.rollback();
                        return reject({ error: ERROR_MESSAGES.NOT_ASSIGNED, statusCode: 400 });
                    }
                    validatedClaimId = claim_id;
                }

                const chat = await this.chatModel.create(
                    {
                        item_id,
                        claim_id: validatedClaimId,
                        sender_id: user.id,
                        receiver_id,
                        message,
                    },
                    { transaction },
                );
                console.log("chat-->", chat);


                // if (requestProfileView && item.type === 'LOST' && receiver_id === item.user_id) {
                //     await this.profilePermissionService.createPermissionRequest(
                //         {
                //             item_id,
                //             owner_id: receiver_id,
                //             requester_id: user.id,
                //             chat_id: chat.id,
                //         },
                //         user.id
                //         //   transaction,
                //     );
                // }

                const createdChat = await this.chatModel.findByPk(chat.id, {
                    include: [
                        { model: Item, as: 'item', attributes: ['id', 'type', 'title', 'status'] },
                        { model: ItemInterests, as: 'claim', attributes: ['id'] },
                        { model: User, as: 'sender', attributes: ['id', 'name', 'email'] },
                        { model: User, as: 'receiver', attributes: ['id', 'name', 'email'] },
                    ],
                    attributes: ['id', 'item_id', 'claim_id', 'sender_id', 'receiver_id', 'message', 'created_at'],
                    raw: true,
                    nest: true,
                    transaction,
                });

                console.log("createdChat-->", createdChat);
                await transaction.commit();
                resolve(createdChat!);
                // });
            } catch (error) {
                await transaction.rollback();
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }

    findAll(
        item_id: string,
        claim_id: string | undefined,
        filters: ChatFilterDto,
        user: AuthUser,
    ): Promise<{ messages: Chat[]; page_context: PageContext }> {
        return new Promise(async (resolve, reject) => {
            try {
                const { page = 1, limit = 5 } = filters;

                const item = await this.itemModel.findByPk(item_id, {
                    attributes: ['id', 'type', 'user_id'],
                    raw: true,
                });
                console.log('item-->', item);
                if (!item) {
                    return reject({ error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 });
                }
                if (item.type === 'FREE') {
                    return reject({ error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 });
                }

                if (user.role !== UserRole.ADMIN && item.user_id !== user.id) {
                    if (item.type === 'FOUND') {
                        if (!claim_id) {
                            return reject({ error: ERROR_MESSAGES.CLAIM_REQUIRED, statusCode: 400 });
                        }
                        const isAssigned = await this.ItemInterestsModel.findOne({
                            where: { item_id, user_id: user.id },
                            attributes: ['id'],
                            raw: true,
                        });
                        console.log('isAssigned-->', isAssigned);
                        if (!isAssigned) {
                            return reject({ error: ERROR_MESSAGES.NOT_ASSIGNED, statusCode: 403 });
                        }
                    }
                }

                const where: any = {
                    item_id,
                    [Op.or]: [{ sender_id: user.id }, { receiver_id: user.id }],
                };
                if (claim_id) {
                    where.claim_id = claim_id;
                }

                const { rows, count } = await this.chatModel.findAndCountAll({
                    where,
                    include: [
                        { model: Item, as: 'item', attributes: ['id', 'type', 'title', 'status'] },
                        { model: ItemInterests, as: 'claim', attributes: ['id'] },
                        { model: User, as: 'sender', attributes: ['id', 'name', 'email'] },
                        { model: User, as: 'receiver', attributes: ['id', 'name', 'email'] },
                    ],
                    attributes: ['id', 'item_id', 'claim_id', 'sender_id', 'receiver_id', 'message', 'created_at'],
                    offset: (page - 1) * limit,
                    limit,
                    raw: true,
                    nest: true,
                    order: [['created_at', 'DESC']],
                });

                const page_context: PageContext = {
                    page,
                    limit,
                    total: count,
                };

                resolve({ messages: rows, page_context });
            } catch (error) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }
}