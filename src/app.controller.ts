import { Controller, Get, Query, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { UserFilterDto } from './modules/users/dto/user-filter.dto';
import { Public } from './common/decorators/public/public.decorator';
import { AuthenticatedRequest } from './common/types/authenticated-request.type';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Public()
  @Get()
  getHello(@Query() filters: UserFilterDto, @Req() req: AuthenticatedRequest): any {
    return this.appService.getHello(filters);
  }

  @Public()
  @Get('user-preference')
  userPreference() {
    return this.appService.userPreference();
  }

  @Public()
  @Get('get-user-preference')
  getUserPreference() {
    return this.appService.getUserPreference();
  }

  @Public()
  @Get('distinct')
  distinct() {
    return this.appService.distinct();
  }

  @Public()
  @Get('raw')
  raw() {
    return this.appService.raw();
  }
  
  @Public()
  @Get('cross')
  cross() {
    return this.appService.cross();
  }

}
