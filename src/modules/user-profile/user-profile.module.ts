import { Module } from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { UserProfileController } from './user-profile.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserProfile } from 'src/common/models/user-profile.model';
import { Item } from 'src/common/models/item.model';
import { ProfileViewRequests } from 'src/common/models/profile-view-request.model';

@Module({
    imports: [SequelizeModule.forFeature([ProfileViewRequests, UserProfile, Item])],
    providers: [UserProfileService],
    controllers: [UserProfileController],
})
export class UserProfileModule { }
