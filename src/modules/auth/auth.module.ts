import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from '../../common/guards/auth/jwt.strategy';
import { AuthGuard } from '../../common/guards/auth/auth.guard';
import { UsersModule } from '../users/users.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../../common/models/users.model';
import { RolesModule } from '../roles/roles.module';
import { Role } from 'src/common/models/role.model';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'yourAccessSecretKey',
      signOptions: { expiresIn: Number(process.env.JWT_EXPIRE) },
    }),
    UsersModule,
    SequelizeModule.forFeature([User, Role]),
    RolesModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AuthGuard],
  exports: [AuthService, JwtModule, PassportModule, AuthGuard],
})
export class AuthModule { }