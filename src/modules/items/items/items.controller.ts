import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
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
import { CreateItemDto } from '../dto/create-item.dto';
import { ItemFilterDto } from '../dto/item-filter.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { UserRole } from 'src/common/models/users.model';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request.type';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthUser } from 'src/common/types/auth-user.type';
import { Item } from 'src/common/models/item.model';
import { GlobalHttpException } from 'src/common/exceptions/global-exception';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';

@ApiTags('Items')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.USER)
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) { }

  @Post()
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

  @Get()
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

  @Get('shared')
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

  @Get('my')
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

  @Get(':id')
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

  @Patch(':id')
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

      return this.itemsService.update(id, updateItemDto, req.user, file);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an item' })
  @ApiParam({ name: 'id', description: 'UUID of the item' })
  @ApiResponse({ status: 200, description: 'Item successfully deleted' })
  @ApiResponse({ status: 403, description: 'You do not own this item' })
  async deleteItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    try {
      return this.itemsService.delete(id, req.user);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

}