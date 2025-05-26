import 'dotenv/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { User } from '../models/users.model';
import { Item } from '../models/item.model';
import { ItemInterests } from '../models/item-interest.model';
import { UserPreference } from '../models/user-preference.model';
import { UserProfile } from '../models/user-profile.model';
import { Chat } from '../models/chat.model';
import { ProfileViewPermissionRequests } from '../models/profile-view-permission.model';

export const sequelizeConfig: SequelizeModuleOptions = {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    models: [User, Item, UserProfile, ItemInterests, UserPreference, Chat, ProfileViewPermissionRequests],
    synchronize: true,
    autoLoadModels: true,
    // logging: false,
    logging: (msg) => console.log(msg),
    // sync: { force: true },
};
