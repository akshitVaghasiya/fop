import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomConfigModule } from './common/config/config.module';
import { DatabaseModule } from './common/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './common/guards/roles/roles.guard';
import { AuthGuard } from './common/guards/auth/auth.guard';
import { ItemsModule } from './modules/items/items.module';
import { GlobalExceptionFilter } from './common/exceptions/global-exception.filter';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { User } from './common/models/users.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { LoggerMiddleware } from './common/middlewares/logger/logger.middleware';
import { UserPreference } from './common/models/user-preference.model';
import { UserProfileModule } from './modules/user-profile/user-profile.module';
import { ChatModule } from './modules/chat/chat.module';
import { ProfilePermissionModule } from './modules/user-profile-permission/profile-permission.module';

@Module({
  imports: [
    DatabaseModule,
    CustomConfigModule,
    UsersModule,
    AuthModule,
    ItemsModule,
    CloudinaryModule,
    SequelizeModule.forFeature([User, UserPreference]),
    UserProfileModule,
    ChatModule,
    ProfilePermissionModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
