import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { UserRole } from 'src/common/models/users.model';
import { InterestsService } from './interests.service';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request.type';
import { GlobalHttpException } from 'src/common/exceptions/global-exception';
import { ItemInterestFilterDto } from '../dto/item-interest-filter.dto';
import { ItemInterest } from 'src/common/models/item-interest.model';

@ApiTags('Item Interests')
@ApiBearerAuth()
@Controller('items/:id/interests')
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Express interest in an item' })
  @ApiResponse({ status: 201, description: 'Interest successfully created' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the item',
  })
  async createInterest(
    @Param('id') item_id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      return await this.interestsService.createInterest(
        item_id,
        req.user.id,
      );
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get interests for an item' })
  @ApiResponse({
    status: 200,
    description: 'List of interests for the item',
    type: [Object],
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the item',
  })
  async getInterests(
    @Param('id') item_id: string,
    @Query() filters: ItemInterestFilterDto
  ): Promise<{ interests: ItemInterest[]; }> {
    try {
      return await this.interestsService.getInterests(item_id, filters);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }
}