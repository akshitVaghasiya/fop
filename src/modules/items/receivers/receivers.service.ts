import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/common/models/users.model';
import { ItemType } from '../types/item-type.enum';
import { ItemStatus } from '../types/item-status.enum';
import { Item } from 'src/common/models/item.model';
import { ItemInterest } from 'src/common/models/item-interest.model';
import { ItemReceiver } from 'src/common/models/item-receiver.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class ReceiversService {
  constructor(
    @InjectModel(User)
    private readonly usersModel: typeof User,
    @InjectModel(Item)
    private readonly itemsModel: typeof Item,
    @InjectModel(ItemInterest)
    private readonly itemInterestModel: typeof ItemInterest,
    @InjectModel(ItemReceiver)
    private readonly itemReceiverModel: typeof ItemReceiver,
  ) {}

  async assignReceiver(
    item_id: string,
    receiver_user_id: string,
    adminId: string,
  ): Promise<ItemReceiver> {
    const item = await this.itemsModel.findOne({
      where: {
        id: item_id,
        type: ItemType.FREE,
        status: ItemStatus.ACTIVE,
      },
    });

    if (!item) {
      throw new NotFoundException('Active free item not found');
    }

    const receiver = await this.usersModel.findOne({
      where: { id: receiver_user_id },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver user not found');
    }

    if (item.user_id === receiver_user_id) {
      throw new ForbiddenException('Cannot assign item to owner');
    }

    const validInterest = await this.itemInterestModel.findOne({
      where: {
        item_id,
        user_id: receiver_user_id,
      },
    });

    if (!validInterest) {
      throw new ForbiddenException(
        'User has not expressed interest in this item',
      );
    }

    const assignment = await this.itemReceiverModel.create({
      item_id,
      receiver_user_id,
      assigned_by: adminId,
    });

    await this.itemsModel.update(
      { status: ItemStatus.CLAIMED },
      { where: { id: item_id } },
    );

    return assignment;
  }
}
