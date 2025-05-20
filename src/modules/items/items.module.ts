import { Module } from '@nestjs/common';
import { ItemsController } from './items/items.controller';
import { ItemsService } from './items/items.service';
import { InterestsController } from './interests/interests.controller';
import { InterestsService } from './interests/interests.service';
import { ReceiversController } from './receivers/receivers.controller';
import { ReceiversService } from './receivers/receivers.service';
import { UsersModule } from '../users/users.module';
import { User } from '../../common/models/users.model';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Item } from 'src/common/models/item.model';
import { ItemInterest } from 'src/common/models/item-interest.model';
import { ItemReceiver } from 'src/common/models/item-receiver.model';
import { Sequelize } from 'sequelize-typescript';

@Module({
  imports: [
    SequelizeModule.forFeature([User, Item, ItemInterest, ItemReceiver]),
    UsersModule,
    CloudinaryModule,
  ],
  controllers: [ItemsController, InterestsController, ReceiversController],
  providers: [
    ItemsService,
    InterestsService,
    ReceiversService,
    {
      provide: 'SEQUELIZE',
      useExisting: Sequelize,
    }
  ],
  exports: [ItemsService],
})
export class ItemsModule { }
