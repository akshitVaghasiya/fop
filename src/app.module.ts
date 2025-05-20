import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomConfigModule } from './common/config/config.module';
import { DatabaseModule } from './common/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RolesGuard } from './common/guards/roles/roles.guard';
import { AuthGuard } from './common/guards/auth/auth.guard';
import { ItemsModule } from './modules/items/items.module';
import { GlobalExceptionFilter } from './common/exceptions/global-exception.filter';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { User } from './common/models/users.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { LoggerMiddleware } from './common/middlewares/logger/logger.middleware';

@Module({
  imports: [
    DatabaseModule,
    CustomConfigModule,
    UsersModule,
    AuthModule,
    ItemsModule,
    CloudinaryModule,
    SequelizeModule.forFeature([User]),
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
