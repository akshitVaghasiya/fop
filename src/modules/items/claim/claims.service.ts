import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ItemClaim } from 'src/common/models/item-claims.model';
import { Item } from 'src/common/models/item.model';
import { ItemReceiver } from 'src/common/models/item-receiver.model';
import { User } from 'src/common/models/users.model';
import { AssignReceiverDto } from '../dto/assign-receiver.dto';
import { AuthUser } from 'src/common/types/auth-user.type';
import { UserRole } from 'src/common/models/users.model';
import { Op, Sequelize } from 'sequelize';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { ItemStatus, ItemType } from 'src/common/types/enums/items.enum';
import { CreateClaimDto } from '../dto/create-claim.dto';
import { ClaimFilterDto } from '../dto/claim-filter.dto';
import { raw } from 'express';

type PageContext = {
    page: number;
    limit: number;
    total: number;
    search?: string;
};

@Injectable()
export class ClaimsService {
    constructor(
        @InjectModel(ItemClaim)
        private readonly itemClaimModel: typeof ItemClaim,
        @InjectModel(Item)
        private readonly itemModel: typeof Item,
        @InjectModel(ItemReceiver)
        private readonly itemReceiverModel: typeof ItemReceiver,
        @InjectModel(User)
        private readonly userModel: typeof User,
        @Inject('SEQUELIZE') private readonly sequelize: Sequelize,
    ) { }

    async create(dto: CreateClaimDto, user: AuthUser): Promise<ItemClaim> {
        return new Promise(async (resolve, reject) => {
            try {
                const item = await this.itemModel.findByPk(dto.item_id, { raw: true });
                console.log("item-->", item);

                if (!item) {
                    return reject({ error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 });
                }
                if (item.type !== ItemType.FOUND) {
                    return reject({ error: 'Can only claim FOUND items', statusCode: 400 });
                }
                if (item.status !== ItemStatus.ACTIVE) {
                    return reject({ error: 'Item is not available for claiming', statusCode: 400 });
                }
                if (item.user_id === user.id) {
                    return reject({ error: 'Cannot claim your own item', statusCode: 400 });
                }

                const existingClaim = await this.itemClaimModel.findOne({
                    where: { item_id: dto.item_id, user_id: user.id },
                });
                if (existingClaim) {
                    return reject({ error: 'You have already claimed this item', statusCode: 400 });
                }

                const claim = await this.itemClaimModel.create({
                    item_id: dto.item_id,
                    user_id: user.id,
                });
                console.log("claim--->", claim);

                resolve(claim);
            } catch (error) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }

    async findAll(
        filters: ClaimFilterDto,
        user: AuthUser,
    ): Promise<{ claims: ItemClaim[]; page_context: PageContext }> {
        return new Promise(async (resolve, reject) => {
            try {
                const { search, page = 1, limit = 5 } = filters;
                const where: any = {};
                if (user.role !== UserRole.ADMIN) {
                    where.user_id = user.id;
                }
                if (search) {
                    where['$item.title$'] = { [Op.iLike]: `%${search}%` };
                }

                const { rows, count } = await this.itemClaimModel.findAndCountAll({
                    where,
                    offset: (page - 1) * limit,
                    limit,
                    include: [
                        { model: Item, as: 'item', required: true },
                        { model: User, as: 'user', attributes: { exclude: ['password'] } },
                    ],
                    order: [['created_at', 'DESC']],
                });

                const page_context: PageContext = {
                    page,
                    limit,
                    total: count,
                    ...(search && { search }),
                };

                resolve({ claims: rows, page_context });
            } catch (error) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }

    async findOneById(id: string, user: AuthUser): Promise<ItemClaim> {
        return new Promise(async (resolve, reject) => {
            try {
                const claim = await this.itemClaimModel.findByPk(id, {
                    include: [
                        { model: Item, as: 'item' },
                        { model: User, as: 'user', attributes: { exclude: ['password'] } },
                    ],
                });
                if (!claim) {
                    return reject({ error: 'Claim not found', statusCode: 404 });
                }

                if (user.role !== UserRole.ADMIN && claim.user_id !== user.id) {
                    return reject({ error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 });
                }

                resolve(claim);
            } catch (error) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }

    async assignReceiver(
        claimId: string,
        dto: AssignReceiverDto,
        admin: AuthUser,
    ): Promise<ItemClaim | null> {
        return new Promise(async (resolve, reject) => {
            const transaction = await this.sequelize.transaction();
            try {
                const claim = await this.itemClaimModel.findByPk(claimId, {
                    include: [{ model: Item, as: 'item' }],
                    raw: true,
                    nest: true,
                    transaction,
                });
                console.log("claim-->", claim);

                if (!claim) {
                    await transaction.rollback();
                    return reject({ error: 'Claim not found', statusCode: 404 });
                }

                if (claim.item.type !== ItemType.FOUND) {
                    await transaction.rollback();
                    return reject({ error: 'Can only assign receivers for FOUND items', statusCode: 400 });
                }
                if (claim.item.status !== ItemStatus.ACTIVE) {
                    await transaction.rollback();
                    return reject({ error: 'Item is not available for assignment', statusCode: 400 });
                }
                if (claim.user_id !== dto.receiver_user_id) {
                    await transaction.rollback();
                    return reject({ error: 'Receiver must match the claim user', statusCode: 400 });
                }

                const receiver = await this.userModel.findByPk(dto.receiver_user_id, { transaction });
                if (!receiver) {
                    await transaction.rollback();
                    return reject({ error: ERROR_MESSAGES.RECEIVER_USER_NOT_FOUND, statusCode: 404 });
                }

                if (claim.item.user_id === dto.receiver_user_id) {
                    await transaction.rollback();
                    return reject({ error: ERROR_MESSAGES.ASSIGN_TO_OWNER_FORBIDDEN, statusCode: 403 });
                }

                await this.itemModel.update(
                    { status: ItemStatus.COMPLETED },
                    { where: { id: claim.item_id }, transaction },
                );

                await this.itemReceiverModel.create(
                    {
                        item_id: claim.item_id,
                        receiver_user_id: dto.receiver_user_id,
                        assigned_by: admin.id,
                    },
                    { transaction },
                );

                const updatedClaim = await this.itemClaimModel.findByPk(claimId, {
                    include: [
                        { model: Item, as: 'item' },
                        { model: User, as: 'user', attributes: { exclude: ['password'] } },
                    ],
                    transaction,
                });

                await transaction.commit();
                resolve(updatedClaim);
            } catch (error) {
                await transaction.rollback();
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }
}