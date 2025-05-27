import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Role } from 'src/common/models/role.model';
import { User } from 'src/common/models/users.model';
import { AuthItem } from 'src/common/models/auth-item.model';
import { AuthChild } from 'src/common/models/auth-child.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Role, User, AuthItem, AuthChild]),
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule { }
