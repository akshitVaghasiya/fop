import { Injectable } from '@nestjs/common';
import { User, UserRole } from 'src/common/models/users.model';
import { Item } from 'src/common/models/item.model';
import { ItemInterest } from 'src/common/models/item-interest.model';
import { InjectModel } from '@nestjs/sequelize';
import { ItemStatus, ItemType } from 'src/common/types/enums/items.enum';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { ItemInterestFilterDto } from '../dto/item-interest-filter.dto';
import { IncludeOptions, Op, WhereOptions } from 'sequelize';


interface PageContext {
    page: number;
    limit: number;
    total: number;
    search?: string;
}

type UserInclude = IncludeOptions & {
    as: 'user';
    model: typeof User;
    where?: WhereOptions;
};

@Injectable()
export class InterestsService {
    constructor(
        @InjectModel(Item)
        private readonly itemsModel: typeof Item,
        @InjectModel(ItemInterest)
        private readonly itemInterestModel: typeof ItemInterest,
    ) { }

    createInterest(
        item_id: string,
        user_id: string,
    ): Promise<ItemInterest> {
        return new Promise(async (resolve, reject) => {
            try {
                const item = await this.itemsModel.findOne({
                    where: {
                        id: item_id,
                        type: ItemType.FREE,
                        status: ItemStatus.ACTIVE,
                    },
                });

                if (!item) {
                    return reject({ error: ERROR_MESSAGES.ACTIVE_ITEM_NOT_FOUND, statusCode: 404 });
                }

                if (item.user_id === user_id) {
                    return reject({
                        error: ERROR_MESSAGES.OWNER_CANNOT_EXPRESS_INTEREST,
                        statusCode: 403,
                    });
                }

                const existingInterest = await this.itemInterestModel.findOne({
                    where: { item_id, user_id },
                });

                if (existingInterest) {
                    return reject({
                        error: ERROR_MESSAGES.INTEREST_ALREADY_EXPRESSED,
                        statusCode: 403,
                    });
                }

                const interest = await this.itemInterestModel.create({ item_id, user_id });
                resolve(interest);
            } catch (err) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }

    getInterests(item_id: string, filters: ItemInterestFilterDto): Promise<{ interests: ItemInterest[]; page_context: PageContext }> {
        return new Promise(async (resolve, reject) => {
            try {
                const {
                    page = 1,
                    limit = 10,
                    search,
                } = filters;

                // const item = await this.itemsModel.findOne({
                //     where: {
                //         id: item_id,
                //         type: ItemType.FREE,
                //     },
                // });

                // const where: WhereOptions = { item_id };
                const where: WhereOptions = {};
                const userInclude: UserInclude = {
                    model: User,
                    as: 'user',
                    required: true,
                    attributes: { exclude: ['password'] }
                };

                if (search) {
                    userInclude.where = {
                        [Op.or]: [
                            { name: { [Op.iLike]: `%${search}%` } },
                        ],
                    };
                }

                const { rows, count } = await this.itemInterestModel.findAndCountAll({
                    where,
                    include: [
                        userInclude,
                        {
                            model: Item,
                            as: 'item',
                            where: {
                                id: item_id,
                                type: ItemType.FREE,
                            },
                            required: true,
                        }
                    ],
                    raw: true,
                    nest: true,
                    offset: (page - 1) * limit,
                    limit,
                });

                // console.log("rows-->", rows);
                const page_context: PageContext = {
                    page,
                    limit,
                    total: count,
                    ...(search && { search }),
                };

                if (count === 0) {
                    return reject({ error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 });
                }

                resolve({ interests: rows, page_context });
            } catch (err) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }
}