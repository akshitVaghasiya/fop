import 'dotenv/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { User } from '../models/users.model';
import { Item } from '../models/item.model';
import { ItemInterest } from '../models/item-interest.model';
import { ItemReceiver } from '../models/item-receiver.model';
import { UserPreference } from '../models/user-preference.model';

export const sequelizeConfig: SequelizeModuleOptions = {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    models: [User, Item, ItemInterest, ItemReceiver, UserPreference],
    synchronize: false,
    // autoLoadModels: true,
    // logging: false,
    logging: (msg) => console.log(msg)
};
