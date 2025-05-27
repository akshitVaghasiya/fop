import { Module } from '@nestjs/common';
import { ChatsController } from './chat.controller';
import { ChatsService } from './chat.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Chat } from 'src/common/models/chat.model';
import { User } from 'src/common/models/users.model';
import { Sequelize } from 'sequelize-typescript';
import { ItemInterests } from 'src/common/models/item-interest.model';
import { Item } from 'src/common/models/item.model';
// import { ProfilePermissionModule } from '../user-profile-permission/profile-permission.module';


@Module({
    imports: [
        SequelizeModule.forFeature([
            Chat,
            ItemInterests,
            User,
            Item,
        ]),
        // ProfilePermissionModule
    ],
    controllers: [ChatsController],
    providers: [
        ChatsService,
        {
            provide: 'SEQUELIZE',
            useExisting: Sequelize,
        }
    ]
})
export class ChatModule { }
