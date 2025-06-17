import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { ItemFilterDto } from './dto/item-filter.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request.type';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Item } from 'src/common/models/item.model';
import { GlobalHttpException } from 'src/common/exceptions/global-exception';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { Public } from 'src/common/decorators/public/public.decorator';
import { CreateFreeItemDto } from './dto/create-free-item.dto';
import { AssignReceiverDto } from './dto/assign-receiver.dto';
import { ItemInterests } from 'src/common/models/item-interest.model';
import { ItemInterestFilterDto } from './dto/item-interest-filter.dto';

@ApiTags('Items')
@Controller()
export class ItemsController {
  constructor(
    protected readonly itemsService: ItemsService
    // private readonly itemInterestsService: ItemInterestsService
  ) { }

  @Public()
  @Post('/items/free')
  @ApiOperation({ summary: 'Create a new free item' })
  @ApiResponse({
    status: 201,
    description: 'Item successfully created',
    type: Item,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or file size exceeds limit',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('itemImage', {
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)/)) {
        return cb(new GlobalHttpException(ERROR_MESSAGES.INVALID_FILE_TYPE, 400), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async createFreeItem(
    @Body() createItemDto: CreateFreeItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Item> {
    try {
      return await this.itemsService.createFreeItem(createItemDto, file);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Post('/items')
  @Roles('item_create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({
    status: 201,
    description: 'Item successfully created',
    type: Item,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or file size exceeds limit',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('itemImage', {
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)/)) {
        return cb(new GlobalHttpException(ERROR_MESSAGES.INVALID_FILE_TYPE, 400), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async createItem(
    @Req() req: AuthenticatedRequest,
    @Body() createItemDto: CreateItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Item> {
    try {
      return await this.itemsService.create(req.user, createItemDto, file);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Public()
  @Get('/items')
  // @Roles('item_list')
  @ApiOperation({ summary: 'Get all items' })
  @ApiResponse({ status: 200, description: 'List of items', type: [Item] })
  @ApiQuery({
    name: 'filters',
    description: 'Filters for retrieving items',
    type: ItemFilterDto,
  })
  async findAll(
    @Query() filters: ItemFilterDto,
  ): Promise<{ items: Item[]; }> {
    try {
      return await this.itemsService.findAll(filters);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Get('/items/shared')
  @Roles('item_shared_list')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get shared items for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of shared items',
    type: [Item],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findSharedItems(
    @Query() filters: Pick<ItemFilterDto, 'page' | 'limit' | 'search'>,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ items: Item[]; }> {
    try {
      return await this.itemsService.findSharedItems(req.user.id, filters);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Get('/items/my')
  @Roles('item_my_list')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get items created by the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of user-created items', type: [Item] })
  @ApiQuery({
    name: 'filters',
    description: 'Filters for retrieving items',
    type: ItemFilterDto,
  })
  async findUserItems(
    @Query() filters: ItemFilterDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ items: Item[]; }> {
    try {
      return await this.itemsService.findUserItems(req.user.id, filters);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Get('/items/:id')
  @Roles('item_view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an item by ID' })
  @ApiParam({ name: 'id', description: 'UUID of the item' })
  @ApiResponse({ status: 200, description: 'Item details', type: Item })
  @ApiResponse({ status: 403, description: 'You do not have access to this item' })
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<Item> {
    try {
      return await this.itemsService.findOne(id, req.user);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Patch('/items/:id')
  @Roles('item_update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an item' })
  @ApiParam({ name: 'id', description: 'UUID of the item' })
  @ApiResponse({ status: 200, description: 'Item successfully updated', type: Item })
  @ApiResponse({ status: 403, description: 'You do not own this item' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('itemImage', {
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)/)) {
        return cb(new GlobalHttpException(ERROR_MESSAGES.INVALID_FILE_TYPE, 400), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async updateItem(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateItemDto: UpdateItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Item> {
    try {
      return await this.itemsService.update(id, updateItemDto, req.user, file);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Patch('/items/:id/reject')
  @Roles('item_reject')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject an item' })
  @ApiParam({ name: 'id', description: 'UUID of the item' })
  @ApiResponse({ status: 200, description: 'Item successfully rejected' })
  @ApiResponse({ status: 403, description: 'You do not have permission' })
  async rejectItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    try {
      return await this.itemsService.rejectItem(id, req.user);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Delete('/items/:id')
  @Roles('item_delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an item' })
  @ApiParam({ name: 'id', description: 'UUID of the item' })
  @ApiResponse({ status: 200, description: 'Item successfully deleted' })
  @ApiResponse({ status: 403, description: 'You do not own this item' })
  async deleteItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    try {
      return await this.itemsService.delete(id, req.user);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

}

// @ApiTags('Items')
// @Controller('items')
export class ItemInterestsController extends ItemsController {
  constructor(
    itemsService: ItemsService
  ) {
    super(itemsService);
  }

  @ApiBearerAuth()
  @Get('items/:item_id/interests')
  @Roles('interest_list')
  @ApiOperation({ summary: 'Get claims/interests for an item' })
  @ApiResponse({ status: 200, description: 'List of claims/interests', type: [ItemInterests] })
  @ApiParam({ name: 'item_id', description: 'UUID of the item', required: true })
  @ApiQuery({ name: 'filters', description: 'Filters for claims/interests', type: ItemInterestFilterDto })
  async getInterests(
    @Param('item_id', ParseUUIDPipe) item_id: string,
    @Query() filters: ItemInterestFilterDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ interests: ItemInterests[]; page_context: any }> {
    try {
      return await this.itemsService.getInterests(item_id, filters, req.user);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @ApiBearerAuth()
  @Post('items/:item_id/interests')
  @Roles('interest_create')
  @ApiOperation({ summary: 'Create a claim (FOUND) or interest (FREE)' })
  @ApiResponse({ status: 201, description: 'Claim/interest created', type: ItemInterests })
  @ApiResponse({ status: 403, description: 'Forbidden (e.g., owner, already claimed)' })
  @ApiParam({ name: 'item_id', description: 'UUID of the item', required: true })
  async createInterest(
    @Req() req: AuthenticatedRequest,
    @Param('item_id', ParseUUIDPipe) item_id: string,
  ): Promise<ItemInterests> {
    try {
      return await this.itemsService.createInterest(item_id, req.user.id);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @ApiBearerAuth()
  @Post('items/:interest_id/assign')
  @Roles('interest_assign')
  @ApiOperation({ summary: 'Assign receiver for claim (FOUND) or interest (FREE)' })
  @ApiResponse({ status: 201, description: 'Receiver assigned', type: ItemInterests })
  @ApiResponse({ status: 403, description: 'Not authorized or invalid assignment' })
  @ApiParam({ name: 'interest_id', description: 'UUID of the claim/interest' })
  async assignReceiver(
    @Param('interest_id', ParseUUIDPipe) interest_id: string,
    @Body() dto: AssignReceiverDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    try {
      return await this.itemsService.assignReceiver(interest_id, req.user);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

}