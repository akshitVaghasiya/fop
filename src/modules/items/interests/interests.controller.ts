import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { UserRole } from 'src/common/models/users.model';
import { InterestsService } from './interests.service';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request.type';

@ApiTags('Item Interests')
@ApiBearerAuth()
@Controller('items/:id/interests')
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  @Post()
  @ApiOperation({ summary: 'Express interest in an item' })
  @ApiResponse({ status: 201, description: 'Interest successfully created' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the item',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  async createInterest(
    @Param('id') item_id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.interestsService.createInterest(
      item_id,
      req.user.id,
      req.user.role,
    );
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
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  async getInterests(@Param('id') item_id: string) {
    return this.interestsService.getInterests(item_id);
  }
}
