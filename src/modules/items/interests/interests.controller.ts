import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ItemInterestsService } from './interests.service';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { ItemInterests } from 'src/common/models/item-interest.model';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request.type';
import { CreateItemInterestDto } from '../dto/create-item-interest.dto';
import { GlobalHttpException } from 'src/common/exceptions/global-exception';
import { ItemInterestFilterDto } from '../dto/item-interest-filter.dto';
import { AssignReceiverDto } from '../dto/assign-receiver.dto';
import { PermissionGuard } from 'src/common/guards/roles/permission.guard';


@ApiTags('Item Interests')
// @Roles(UserRole.ADMIN, UserRole.USER)
@ApiBearerAuth()
@Controller('item_interests')
export class ItemInterestsController {
  constructor(private readonly itemInterestsService: ItemInterestsService) { }

  @Post()
  @Roles('interest_create')
  @UseGuards(PermissionGuard)
  @ApiOperation({ summary: 'Create a claim (FOUND) or interest (FREE)' })
  @ApiResponse({ status: 201, description: 'Claim/interest created', type: ItemInterests })
  @ApiResponse({ status: 403, description: 'Forbidden (e.g., owner, already claimed)' })
  async createInterest(
    @Req() req: AuthenticatedRequest,
    @Body() createDto: CreateItemInterestDto,
  ): Promise<ItemInterests> {
    try {
      return await this.itemInterestsService.createInterest(createDto, req.user.id);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Get()
  @Roles('interest_list')
  @UseGuards(PermissionGuard)
  @ApiOperation({ summary: 'Get claims/interests for an item' })
  @ApiResponse({ status: 200, description: 'List of claims/interests', type: [ItemInterests] })
  @ApiQuery({ name: 'item_id', description: 'UUID of the item', required: true })
  @ApiQuery({ name: 'filters', description: 'Filters for claims/interests', type: ItemInterestFilterDto })
  async getInterests(
    @Query('item_id', ParseUUIDPipe) item_id: string,
    @Query() filters: ItemInterestFilterDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ interests: ItemInterests[]; page_context: any }> {
    try {
      return await this.itemInterestsService.getInterests(item_id, filters, req.user);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Post(':id/assign')
  @Roles('interest_assign')
  @UseGuards(PermissionGuard)
  @ApiOperation({ summary: 'Assign receiver for claim (FOUND) or interest (FREE)' })
  @ApiResponse({ status: 201, description: 'Receiver assigned', type: ItemInterests })
  @ApiResponse({ status: 403, description: 'Not authorized or invalid assignment' })
  @ApiParam({ name: 'id', description: 'UUID of the claim/interest' })
  async assignReceiver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignReceiverDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    try {
      return await this.itemInterestsService.assignReceiver(id, req.user);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }
}