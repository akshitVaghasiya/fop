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
}
