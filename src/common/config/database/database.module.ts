import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { sequelizeConfig } from './database.config';

@Module({
  imports: [
    SequelizeModule.forRoot(sequelizeConfig),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule { }
