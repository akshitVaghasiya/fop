import { Module } from '@nestjs/common';
import { ItemsController } from './items/items.controller';
import { ItemsService } from './items/items.service';
import { ItemInterestsController } from './interests/interests.controller';
import { ItemInterestsService } from './interests/interests.service';
import { UsersModule } from '../users/users.module';
import { User } from '../../common/models/users.model';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Item } from 'src/common/models/item.model';
import { ItemInterests } from 'src/common/models/item-interest.model';
import { Sequelize } from 'sequelize-typescript';
import { ProfilePermissionModule } from '../user-profile-permission/profile-permission.module';

@Module({
  imports: [
    SequelizeModule.forFeature([User, Item, ItemInterests]),
    UsersModule,
    CloudinaryModule,
    ProfilePermissionModule
  ],
  controllers: [ItemsController, ItemInterestsController],
  providers: [
    ItemsService,
    ItemInterestsService,
    {
      provide: 'SEQUELIZE',
      useExisting: Sequelize,
    }
  ],
  exports: [ItemsService],
})
export class ItemsModule { }
