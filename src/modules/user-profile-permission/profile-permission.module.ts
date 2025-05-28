import { Module } from '@nestjs/common';
import { ProfilePermissionController } from './profile-permission.controller';
import { ProfilePermissionService } from './profile-permission.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Chat } from 'src/common/models/chat.model';
import { ItemInterests } from 'src/common/models/item-interest.model';
import { User } from 'src/common/models/users.model';
import { Item } from 'src/common/models/item.model';
import { Sequelize } from 'sequelize-typescript';
import { ProfileViewRequests } from 'src/common/models/profile-view-request.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Chat,
      ItemInterests,
      User,
      Item,
      ProfileViewRequests
    ]),
  ],
  controllers: [ProfilePermissionController],
  providers: [
    ProfilePermissionService,
    {
      provide: 'SEQUELIZE',
      useExisting: Sequelize,
    }],
  exports: [ProfilePermissionService],
})
export class ProfilePermissionModule { }
