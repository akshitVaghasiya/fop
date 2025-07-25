import 'dotenv/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { User } from '../../models/users.model';
import { Item } from '../../models/item.model';
import { ItemInterests } from '../../models/item-interest.model';
import { UserPreference } from '../../models/user-preference.model';
import { UserProfile } from '../../models/user-profile.model';
import { Chat } from '../../models/chat.model';
import { ProfileViewRequests } from '../../models/profile-view-request.model';
import { Role } from '../../models/role.model';
import { AuthChild } from '../../models/auth-child.model';
import { AuthItem } from '../../models/auth-item.model';


let dialectOptions = {};
let ssl = false;

const caCert = Buffer.from(process.env.PG_CA_CERT_BASE64!, 'base64').toString('utf-8');
if (process.env.NODE_ENV === 'production') {
    dialectOptions = {
        ssl: {
            require: true,
            rejectUnauthorized: true,
            ca: caCert,
        },
    };
}

export const sequelizeConfig: SequelizeModuleOptions = {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    models: [
        User,
        Item,
        UserProfile,
        ItemInterests,
        UserPreference,
        Chat,
        ProfileViewRequests,
        Role,
        AuthChild,
        AuthItem
    ],
    logging: (msg) => console.log(msg),
    ssl: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: true,
            ca: caCert,
        },
    },
};