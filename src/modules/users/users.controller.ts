import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request.type';
import { User } from '../../common/models/users.model';
import { UserFilterDto } from './dto/user-filter.dto';
import { UserRole } from '../../common/models/users.model';
import { UpdateUserStatusDto } from './dto/user-status.dto';
import { GlobalHttpException } from 'src/common/exceptions/global-exception';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) { }

  // @Get('me')
  // @Roles(UserRole.ADMIN, UserRole.USER)
  // @ApiOperation({ summary: 'Get current user details' })
  // @ApiResponse({ status: 200, description: 'Current user details', type: User })
  // @ApiResponse({ status: 404, description: 'User not found' })
  // async me(@Req() req: AuthenticatedRequest) {
  //   try {
  //     return await this.userService.me(req.user.id);
  //   } catch (err) {
  //     throw new GlobalHttpException(err.error, err.statusCode);
  //   }
  // }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of all users', type: [User] })
  async findAll(
    @Query() filters: UserFilterDto,
  ): Promise<{ data: User[]; total: number }> {
    try {
      return await this.userService.findAll(filters);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get details of a specific user' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'User details', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    try {
      return await this.userService.findOneById(id);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user details' })
  @ApiParam({ name: 'id', description: 'UUID of the user' })
  @ApiResponse({ status: 200, description: 'Updated user details', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateUserDto,
  ) {
    try {
      return await this.userService.updateUser(id, updateDto);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user active status' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Updated user status', type: User })
  @ApiResponse({
    status: 403,
    description: 'Forbidden to change your own status',
  })
  async updateUserStatus(
    @Param('id') user_id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      return await this.userService.updateUserStatus(user_id, dto.is_active, req.user);
    } catch (err) {
      throw new GlobalHttpException(err.error, err.statusCode);
    }
  }
}