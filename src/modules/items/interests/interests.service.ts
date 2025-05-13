import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { User, UserRole } from 'src/common/models/users.model';
import { ItemType } from '../types/item-type.enum';
import { ItemStatus } from '../types/item-status.enum';
import { Item } from 'src/common/models/item.model';
import { ItemInterest } from 'src/common/models/item-interest.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class InterestsService {
    constructor(
        @InjectModel(Item)
        private readonly itemsModel: typeof Item,
        @InjectModel(ItemInterest)
        private readonly itemInterestModel: typeof ItemInterest,
    ) { }

    async createInterest(
        item_id: string,
        user_id: string,
        role: UserRole,
    ): Promise<ItemInterest> {
        const item = await this.itemsModel.findOne({
            where: {
                id: item_id,
                type: ItemType.FREE,
                status: ItemStatus.ACTIVE,
            },
        });

        if (!item) {
            throw new NotFoundException('Free item not found');
        }

        if (item.user_id === user_id && role !== UserRole.ADMIN) {
            throw new ForbiddenException(
                'Owners cannot express interest in their items',
            );
        }

        const existingInterest = await this.itemInterestModel.findOne({
            where: { item_id, user_id },
        });

        if (existingInterest) {
            throw new ForbiddenException('Interest already expressed for this item');
        }

        const interest = await this.itemInterestModel.create({ item_id, user_id });

        return interest;
    }

    async getInterests(item_id: string): Promise<ItemInterest[]> {
        const item = await this.itemsModel.findOne({
            where: {
                id: item_id,
                type: ItemType.FREE,
            },
        });

        if (!item) {
            throw new NotFoundException('Free item not found');
        }

        const interests = await this.itemInterestModel.findAll({
            where: { item_id },
            include: [
                {
                    association: 'user',
                    // required: true, // inner join
                    right: true // for right join
                },
            ],
            // order: [['user.created_at', 'DESC']],
            order: [[{ model: User, as: 'user' }, 'created_at', 'ASC']],
            limit: 1,
            offset: 1,
        });

        return interests;
    }
}
