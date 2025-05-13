import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
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

@ApiTags('Items')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.USER)
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

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
  @UseInterceptors(FileInterceptor('itemImage'))
  async createItem(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body() createItemDto: CreateItemDto,
  ): Promise<Item> {
    if (file) {
      const allowedMimeTypes = ['image/jpeg', 'image/png'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Invalid file type. Only JPG and PNG are allowed.',
        );
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new BadRequestException('File size exceeds 5MB limit.');
      }
    }

    return this.itemsService.create(req.user, createItemDto, file);
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
  ): Promise<{ data: Item[]; total: number }> {
    return this.itemsService.findAll(filters);
  }

  @Get('shared')
  @ApiOperation({ summary: 'Get shared items for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of shared items',
    type: [Item],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
  })
  async findSharedItems(
    @Query() filters: Pick<ItemFilterDto, 'page' | 'limit' | 'search'>,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ data: Item[]; total: number }> {
    console.log('filters-->', filters);

    return this.itemsService.findSharedItems(req.user.id, filters);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get items created by the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of user-created items',
    type: [Item],
  })
  @ApiQuery({
    name: 'filters',
    description: 'Filters for retrieving items',
    type: ItemFilterDto,
  })
  async findUserItems(
    @Query() filters: ItemFilterDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ data: Item[]; total: number }> {
    return this.itemsService.findUserItems(req.user.id, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an item by ID' })
  @ApiParam({ name: 'id', description: 'UUID of the item' })
  @ApiResponse({ status: 200, description: 'Item details', type: Item })
  @ApiResponse({
    status: 403,
    description: 'You do not have access to this item',
  })
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<Item> {
    console.log('id->', id);

    const item = await this.itemsService.findOne(id);
    this.validateItemAccess(req.user, item);
    return item;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an item' })
  @ApiParam({ name: 'id', description: 'UUID of the item' })
  @ApiResponse({
    status: 200,
    description: 'Item successfully updated',
    type: Item,
  })
  @ApiResponse({ status: 403, description: 'You do not own this item' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('itemImage'))
  async updateItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Item> {
    const item = await this.itemsService.findOne(id);
    this.validateItemOwnership(req.user, item);
    return this.itemsService.update(item.id, updateItemDto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an item' })
  @ApiParam({ name: 'id', description: 'UUID of the item' })
  @ApiResponse({ status: 200, description: 'Item successfully deleted' })
  @ApiResponse({ status: 403, description: 'You do not own this item' })
  async deleteItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<string> {
    const item = await this.itemsService.findOne(id);
    this.validateItemOwnership(req.user, item);
    return this.itemsService.delete(id, req.user);
  }

  private validateItemAccess(user: AuthUser, item: Item): void {
    if (user.role !== UserRole.ADMIN && item.user.id !== user.id) {
      throw new ForbiddenException('You do not have access to this item');
    }
  }

  private validateItemOwnership(user: AuthUser, item: Item): void {
    if (user.role !== UserRole.ADMIN && item.user.id !== user.id) {
      throw new ForbiddenException('You do not own this item');
    }
  }
}
