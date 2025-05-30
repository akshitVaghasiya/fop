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
import { ProfilePermissionService } from 'src/modules/user-profile-permission/profile-permission.service';
import { UserRole } from 'src/common/types/enums/users.enum';
import { ItemType, ItemStatus } from 'src/common/types/enums/items.enum';

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
        private readonly profilePermissionService: ProfilePermissionService,
    ) { }

    createInterest(dto: CreateItemInterestDto, user_id: string): Promise<ItemInterests> {
        return new Promise(async (resolve, reject) => {
            try {
                const item = await this.itemsModel.findOne({
                    where: { id: dto.item_id, type: { [Op.in]: [ItemType.FOUND, ItemType.FREE] }, status: ItemStatus.ACTIVE },
                    raw: true,
                    nest: true,
                });
                if (!item) {
                    return reject({ error: ERROR_MESSAGES.ACTIVE_ITEM_NOT_FOUND, statusCode: 404 });
                }
                console.log("item-->", item);

                if (item.user_id === user_id) {
                    return reject({ error: ERROR_MESSAGES.OWNER_CANNOT_EXPRESS_INTEREST, statusCode: 403 });
                }
                const existingInterest = await this.itemInterestsModel.findOne({
                    where: { item_id: dto.item_id, user_id },
                });
                if (existingInterest) {
                    return reject({ error: ERROR_MESSAGES.INTEREST_ALREADY_EXPRESSED, statusCode: 403 });
                }
                const interest = await this.itemInterestsModel.create(
                    { item_id: dto.item_id, user_id },
                );

                resolve(interest);
            } catch (err) {
                reject({ error: err.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: err.statusCode || 500 });
            }
        });
    }

    getInterests(
        item_id: string,
        filters: ItemInterestFilterDto,
        user: AuthUser,
    ): Promise<{ interests: ItemInterests[]; page_context: PageContext }> {
        return new Promise(async (resolve, reject) => {
            try {
                const { page = 1, limit = 10, search } = filters;
                const item = await this.itemsModel.findByPk(item_id, { raw: true, nest: true });
                console.log("item-->", item);
                if (!item) {
                    return reject({ error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 });
                }
                if (user.role !== UserRole.ADMIN && item.user_id !== user.id) {
                    return reject({ error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 });
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
                resolve({ interests: rows, page_context });
            } catch (err) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }

    assignReceiver(id: string, user: AuthUser): Promise<{ message: string }> {
        return new Promise(async (resolve, reject) => {
            const transaction = await this.sequelize.transaction();
            try {
                const interest = await this.itemInterestsModel.findByPk(id, {
                    include: [{ model: Item, as: 'item' }],
                    raw: true,
                    nest: true,
                    transaction,
                });

                if (!interest) {
                    return reject({ error: ERROR_MESSAGES.INTEREST_NOT_FOUND, statusCode: 404 });
                }

                const item = interest.item;

                if (item.status !== ItemStatus.ACTIVE) {
                    return reject({ error: ERROR_MESSAGES.ITEM_NOT_ACTIVE, statusCode: 400 });
                }
                if (item.type === ItemType.FREE && user.role !== UserRole.ADMIN) {
                    return reject({ error: ERROR_MESSAGES.ADMIN_ONLY, statusCode: 403 });
                }
                if (item.type === ItemType.FOUND && user.role !== UserRole.ADMIN && item.user_id !== user.id) {
                    return reject({ error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 });
                }
                if (item.type !== ItemType.FOUND && item.type !== ItemType.FREE) {
                    return reject({ error: ERROR_MESSAGES.INVALID_ITEM_TYPE, statusCode: 400 });
                }

                const receiver = await this.usersModel.findOne({
                    where: { id: interest.user_id },
                    transaction,
                });

                if (!receiver) {
                    return reject({ error: ERROR_MESSAGES.RECEIVER_USER_NOT_FOUND, statusCode: 404 });
                }
                if (item.user_id === interest.user_id) {
                    return reject({ error: ERROR_MESSAGES.ASSIGN_TO_OWNER_FORBIDDEN, statusCode: 403 });
                }
                // if (interest.user_id !== interest.user_id) {
                //     await transaction.rollback();
                //     return reject({ error: ERROR_MESSAGES.INVALID_INTEREST, statusCode: 403 });
                // }
                const existingAssignment = await this.itemInterestsModel.findOne({
                    where: { item_id: item.id, assigned_by: { [Op.ne]: null } },
                    transaction,
                });

                if (existingAssignment) {
                    return reject({ error: ERROR_MESSAGES.ITEM_ALREADY_ASSIGNED, statusCode: 400 });
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
                //     return reject({ error: ERROR_MESSAGES.INTEREST_NOT_FOUND, statusCode: 404 });
                // }

                await transaction.commit();
                resolve({ message: 'item assigned successfully' });
            } catch (err) {
                await transaction.rollback();
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }
}