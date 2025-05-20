import { Injectable } from '@nestjs/common';
import { User, UserRole } from 'src/common/models/users.model';
import { Item } from 'src/common/models/item.model';
import { ItemInterest } from 'src/common/models/item-interest.model';
import { InjectModel } from '@nestjs/sequelize';
import { ItemStatus, ItemType } from 'src/common/types/enums/items.enum';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';

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

    getInterests(item_id: string): Promise<ItemInterest[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const item = await this.itemsModel.findOne({
                    where: {
                        id: item_id,
                        type: ItemType.FREE,
                    },
                });
                console.log("item-->", item);

                if (!item) {
                    return reject({ error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 });
                }

                const interests = await this.itemInterestModel.findAll({
                    where: { item_id },
                    include: [
                        {
                            model: User,
                            as: 'user',
                        },
                    ],
                });

                resolve(interests);
            } catch (err) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }
}