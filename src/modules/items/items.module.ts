import { Module } from '@nestjs/common';
import { ItemsController } from './items/items.controller';
import { ItemsService } from './items/items.service';
import { ItemInterestsController } from './interests/interests.controller';
import { ItemInterestsService } from './interests/interests.service';
import { ReceiversController } from './receivers/receivers.controller';
import { ReceiversService } from './receivers/receivers.service';
import { UsersModule } from '../users/users.module';
import { User } from '../../common/models/users.model';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Item } from 'src/common/models/item.model';
import { ItemInterests } from 'src/common/models/item-interest.model';
import { ItemReceiver } from 'src/common/models/item-receiver.model';
import { Sequelize } from 'sequelize-typescript';
import { ClaimsController } from './claim/claims.controller';
import { ClaimsService } from './claim/claims.service';
import { ItemClaim } from 'src/common/models/item-claims.model';

@Module({
  imports: [
    SequelizeModule.forFeature([User, Item, ItemInterests, ItemReceiver, ItemClaim]),
    UsersModule,
    CloudinaryModule,
  ],
  controllers: [ItemsController, ItemInterestsController, ReceiversController, ClaimsController],
  providers: [
    ItemsService,
    ItemInterestsService,
    ReceiversService,
    ClaimsService,
    {
      provide: 'SEQUELIZE',
      useExisting: Sequelize,
    }
  ],
  exports: [ItemsService],
})
export class ItemsModule { }
