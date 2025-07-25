import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize, WhereOptions } from 'sequelize';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { ItemInterests } from 'src/common/models/item-interest.model';
import { Item } from 'src/common/models/item.model';
import { User } from 'src/common/models/users.model';
import { ItemInterestFilterDto } from '../dto/item-interest-filter.dto';
import { AuthUser } from 'src/common/types/auth-user.type';
import { CreateItemInterestDto } from '../dto/create-item-interest.dto';
import { ItemType, ItemStatus } from 'src/common/types/enums/items.enum';
import { isAdminRole } from 'src/common/utils/role.util';

interface PageContext {
    page: number;
    limit: number;
    total: number;
    search?: string;
}

@Injectable()
export class ItemInterestsService {
    constructor(
        @InjectModel(Item) private readonly itemsModel: typeof Item,
        @InjectModel(ItemInterests) private readonly itemInterestsModel: typeof ItemInterests,
        @InjectModel(User) private readonly usersModel: typeof User,
        @Inject('SEQUELIZE') private readonly sequelize: Sequelize,
    ) { }

    async createInterest(dto: CreateItemInterestDto, user_id: string): Promise<ItemInterests> {
        try {
            const item = await this.itemsModel.findOne({
                where: { id: dto.item_id, type: { [Op.in]: [ItemType.FOUND, ItemType.FREE] }, status: ItemStatus.ACTIVE },
                raw: true,
                nest: true,
            });
            if (!item) {
                throw { error: ERROR_MESSAGES.ACTIVE_ITEM_NOT_FOUND, statusCode: 404 };
            }

            if (item.user_id === user_id) {
                throw { error: ERROR_MESSAGES.OWNER_CANNOT_EXPRESS_INTEREST, statusCode: 403 };
            }
            const existingInterest = await this.itemInterestsModel.findOne({
                where: { item_id: dto.item_id, user_id },
            });
            if (existingInterest) {
                throw { error: ERROR_MESSAGES.INTEREST_ALREADY_EXPRESSED, statusCode: 403 };
            }
            const interest = await this.itemInterestsModel.create(
                { item_id: dto.item_id, user_id },
            );

            return interest;
        } catch (err) {
            throw { error: err.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: err.statusCode || 500 };
        }
    }

    async getInterests(
        item_id: string,
        filters: ItemInterestFilterDto,
        user: AuthUser,
    ): Promise<{ interests: ItemInterests[]; page_context: PageContext }> {
        try {
            const { page = 1, limit = 10, search } = filters;
            const item = await this.itemsModel.findByPk(item_id, { raw: true, nest: true });

            if (!item) {
                throw { error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 };
            }
            if (!isAdminRole(user.role_name) && item.user_id !== user.id) {
                throw { error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 };
            }
            const where: WhereOptions = { item_id };
            const userInclude = {
                model: User,
                as: 'user',
                ...(search && {
                    where: { name: { [Op.iLike]: `%${search}%` } },
                }),
            };
            const { rows, count } = await this.itemInterestsModel.findAndCountAll({
                where,
                include: [userInclude, { model: Item, as: 'item' }],
                offset: (page - 1) * limit,
                limit,
            });
            const page_context: PageContext = {
                page,
                limit,
                total: count,
                ...(search && { search }),
            };
            return { interests: rows, page_context };
        } catch (err) {
            throw { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 };
        }
    }

    async assignReceiver(id: string, user: AuthUser): Promise<{ message: string }> {
        const transaction = await this.sequelize.transaction();
        try {
            const interest = await this.itemInterestsModel.findByPk(id, {
                include: [{ model: Item, as: 'item' }],
                raw: true,
                nest: true,
                transaction,
            });

            if (!interest) {
                throw { error: ERROR_MESSAGES.INTEREST_NOT_FOUND, statusCode: 404 };
            }

            const item = interest.item;

            if (item.status !== ItemStatus.ACTIVE) {
                throw { error: ERROR_MESSAGES.ITEM_NOT_ACTIVE, statusCode: 400 };
            }
            if (item.type === ItemType.FREE && !isAdminRole(user.role_name)) {
                throw { error: ERROR_MESSAGES.ADMIN_ONLY, statusCode: 403 };
            }
            if (item.type === ItemType.FOUND && !isAdminRole(user.role_name) && item.user_id !== user.id) {
                throw { error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 };
            }
            if (item.type !== ItemType.FOUND && item.type !== ItemType.FREE) {
                throw { error: ERROR_MESSAGES.INVALID_ITEM_TYPE, statusCode: 400 };
            }

            const receiver = await this.usersModel.findOne({
                where: { id: interest.user_id },
                transaction,
            });

            if (!receiver) {
                throw { error: ERROR_MESSAGES.RECEIVER_USER_NOT_FOUND, statusCode: 404 };
            }
            if (item.user_id === interest.user_id) {
                throw { error: ERROR_MESSAGES.ASSIGN_TO_OWNER_FORBIDDEN, statusCode: 403 };
            }
            // if (interest.user_id !== interest.user_id) {
            //     await transaction.rollback();
            //     throw { error: ERROR_MESSAGES.INVALID_INTEREST, statusCode: 403 };
            // }
            const existingAssignment = await this.itemInterestsModel.findOne({
                where: { item_id: item.id, assigned_by: { [Op.ne]: null } },
                transaction,
            });

            if (existingAssignment) {
                throw { error: ERROR_MESSAGES.ITEM_ALREADY_ASSIGNED, statusCode: 400 };
            }

            await this.itemInterestsModel.update(
                { assigned_by: user.id },
                { where: { id }, transaction },
            );

            await this.itemsModel.update(
                { status: ItemStatus.COMPLETED },
                { where: { id: item.id }, transaction },
            );

            // const updatedInterest = await this.itemInterestsModel.findByPk(id, {
            //     transaction,
            // });
            // if (!updatedInterest) {
            //     await transaction.rollback();
            //     throw { error: ERROR_MESSAGES.INTEREST_NOT_FOUND, statusCode: 404 };
            // }

            await transaction.commit();
            return { message: 'item assigned successfully' };
        } catch (err) {
            await transaction.rollback();
            throw { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 };
        }
    }
}