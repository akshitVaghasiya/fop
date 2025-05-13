import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserFilterDto } from './modules/users/dto/user-filter.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @ApiBearerAuth()
  getHello(@Query() filters: UserFilterDto,): any {
    return this.appService.getHello(filters);
  }
}
