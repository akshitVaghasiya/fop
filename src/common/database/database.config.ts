import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { User } from '../models/users.model';
import { Item } from '../models/item.model';
import { ItemInterest } from '../models/item-interest.model';
import { ItemReceiver } from '../models/item-receiver.model';

export const sequelizeConfig: SequelizeModuleOptions = {
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  models: [User, Item, ItemInterest, ItemReceiver],
  // synchronize: process.env.DB_SYNCHRONIZE === 'true',
  autoLoadModels: true,
  logging: true,
};
