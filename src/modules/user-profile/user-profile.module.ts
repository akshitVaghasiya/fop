import { Module } from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { UserProfileController } from './user-profile.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserProfile } from 'src/common/models/user-profile.model';
import { Item } from 'src/common/models/item.model';
import { ProfileViewRequests } from 'src/common/models/profile-view-request.model';
import { User } from 'src/common/models/users.model';
import { ItemInterests } from 'src/common/models/item-interest.model';
import { Chat } from 'src/common/models/chat.model';
import { Sequelize } from 'sequelize-typescript';

@Module({
    imports: [SequelizeModule.forFeature([ProfileViewRequests, UserProfile, Item, User, ItemInterests, Chat])],
    providers: [
        UserProfileService,
        {
            provide: 'SEQUELIZE',
            useExisting: Sequelize,
        }
    ],
    controllers: [UserProfileController],
})
export class UserProfileModule { }
