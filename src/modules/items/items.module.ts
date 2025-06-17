import { Module } from '@nestjs/common';
import { ItemInterestsController, ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { UsersModule } from '../users/users.module';
import { User } from '../../common/models/users.model';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Item } from 'src/common/models/item.model';
import { ItemInterests } from 'src/common/models/item-interest.model';
import { Sequelize } from 'sequelize-typescript';

@Module({
  imports: [
    SequelizeModule.forFeature([User, Item, ItemInterests]),
    UsersModule,
    CloudinaryModule,
  ],
  controllers: [ItemsController, ItemInterestsController],
  providers: [
    ItemsService,
    {
      provide: 'SEQUELIZE',
      useExisting: Sequelize,
    }
  ],
  exports: [ItemsService],
})
export class ItemsModule { }
