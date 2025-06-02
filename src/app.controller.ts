import { Controller, Get, Query, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { UserFilterDto } from './modules/users/dto/user-filter.dto';
import { Public } from './common/decorators/public/public.decorator';
import { AuthenticatedRequest } from './common/types/authenticated-request.type';
import { GlobalHttpException } from './common/exceptions/global-exception';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Public()
  @Get('ping')
  ping() {
    return 'pong';
  }

  @Public()
  @Get()
  getHello() {
    return "server is running";
  }

  @Public()
  @Get('auth_child')
  async authChild() {
    return await this.appService.authChild();
  }

  @Public()
  @Get('auth_Item')
  async authItem() {
    return await this.appService.authItem();
  }

  // @Public()
  // @Get('user-preference')
  // userPreference() {
  //   return this.appService.userPreference();
  // }

  // @Public()
  // @Get('get-user-preference')
  // getUserPreference() {
  //   return this.appService.getUserPreference();
  // }

  // @Public()
  // @Get('distinct')
  // distinct() {
  //   return this.appService.distinct();
  // }

  // @Public()
  // @Get('raw')
  // async raw() {
  //   try {
  //     // return await this.authService.userInfo(req.user.id);
  //     return await this.appService.raw();
  //   } catch (err) {
  //     throw new GlobalHttpException(err.error, err.statusCode);
  //   }
  // }

  // @Public()
  // @Get('cross')
  // cross() {
  //   return this.appService.cross();
  // }

}
