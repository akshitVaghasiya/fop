import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../../common/models/users.model';
import { PermissionGuard } from 'src/common/guards/roles/permission.guard';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, PermissionGuard],
  exports: [UsersService],
})
export class UsersModule { }
