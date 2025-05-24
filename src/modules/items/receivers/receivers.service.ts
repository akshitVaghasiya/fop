import { Inject, Injectable } from '@nestjs/common';
import { User } from 'src/common/models/users.model';
import { Item } from 'src/common/models/item.model';
import { ItemInterests } from 'src/common/models/item-interest.model';
import { ItemReceiver } from 'src/common/models/item-receiver.model';
import { InjectModel } from '@nestjs/sequelize';
import { ItemStatus, ItemType } from 'src/common/types/enums/items.enum';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class ReceiversService {
    constructor(
        @InjectModel(User)
        private readonly usersModel: typeof User,
        @InjectModel(Item)
        private readonly itemsModel: typeof Item,
        @InjectModel(ItemInterests)
        private readonly itemInterestModel: typeof ItemInterests,
        @InjectModel(ItemReceiver)
        private readonly itemReceiverModel: typeof ItemReceiver,
        @Inject('SEQUELIZE') private readonly sequelize: Sequelize,
    ) { }

    assignReceiver(
        item_id: string,
        receiver_user_id: string,
        adminId: string,
    ): Promise<ItemReceiver> {
        return new Promise(async (resolve, reject) => {
            const transaction = await this.sequelize.transaction();
            try {
                const item = await this.itemsModel.findOne({
                    where: {
                        id: item_id,
                        type: ItemType.FREE,
                        status: ItemStatus.ACTIVE,
                    },
                    transaction
                });

                if (!item) {
                    return reject({ error: ERROR_MESSAGES.ACTIVE_ITEM_NOT_FOUND, statusCode: 404 });
                }

                const receiver = await this.usersModel.findOne({
                    where: { id: receiver_user_id },
                    transaction
                });

                if (!receiver) {
                    return reject({ error: ERROR_MESSAGES.RECEIVER_USER_NOT_FOUND, statusCode: 404 });
                }

                if (item.user_id === receiver_user_id) {
                    return reject({ error: ERROR_MESSAGES.ASSIGN_TO_OWNER_FORBIDDEN, statusCode: 403 });
                }

                const validInterest = await this.itemInterestModel.findOne({
                    where: {
                        item_id,
                        user_id: receiver_user_id,
                    },
                    transaction
                });

                if (!validInterest) {
                    return reject({ error: ERROR_MESSAGES.INVALID_INTEREST, statusCode: 403 });
                }

                const assignment = await this.itemReceiverModel.create(
                    {
                        item_id,
                        receiver_user_id,
                        assigned_by: adminId,
                    },
                    { transaction }
                );

                await this.itemsModel.update(
                    { status: ItemStatus.CLAIMED },
                    { where: { id: item_id }, transaction },
                );
                await transaction.commit();
                resolve(assignment);
            } catch (err) {
                await transaction.rollback();
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }
}