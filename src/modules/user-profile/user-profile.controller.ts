import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBearerAuth,
    ApiQuery,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserProfileFilterDto } from './dto/user-profile-filter.dto';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request.type';
import { UserProfile } from 'src/common/models/user-profile.model';
import { GlobalHttpException } from 'src/common/exceptions/global-exception';
import { UserProfileService } from './user-profile.service';
import { PermissionGuard } from 'src/common/guards/roles/permission.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { ProfileViewRequests } from 'src/common/models/profile-view-request.model';
import { PermissionRequestFilterDto } from './dto/permission-request-filter.dto';
import { UpdateStatusProfileDto } from './dto/update-status.dto';
import { ApprovePermissionRequestFilterDto } from './dto/approve-permission-request-filter.dto';

@ApiTags('User Profiles')
@ApiBearerAuth()
@Controller('user_profiles')
export class UserProfileController {
    constructor(private readonly userProfilesService: UserProfileService) { }

    @Post()
    @Roles('user_profile_create')
    @ApiOperation({ summary: 'Create a user profile' })
    @ApiResponse({ status: 201, description: 'Created user profile', type: UserProfile })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('profile_picture', {
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)/)) {
                return cb(new GlobalHttpException(ERROR_MESSAGES.INVALID_FILE_TYPE, 400), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 },
    }))
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() createDto: CreateUserProfileDto,
        @UploadedFile() file?: Express.Multer.File,
    ): Promise<UserProfile> {
        try {
            return await this.userProfilesService.create(createDto, req.user, file);
        } catch (err) {
            console.log("err->", err);

            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Get()
    @Roles('user_profile_list')
    @ApiOperation({ summary: 'Get all user profiles' })
    @ApiResponse({ status: 200, description: 'List of all user profiles', type: [UserProfile] })
    async findAll(
        @Query() filters: UserProfileFilterDto,
    ): Promise<{ profiles: UserProfile[]; page_context: { page: number; limit: number; total: number } }> {
        try {
            return await this.userProfilesService.findAll(filters);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Get(':id')
    @Roles('user_profile_view')
    @ApiOperation({ summary: 'Get a user profile (item_id optional for self/admin)' })
    @ApiParam({ name: 'id', description: 'UUID of the user' })
    @ApiQuery({ name: 'item_id', description: 'UUID of the item for permission check', required: false })
    @ApiResponse({ status: 200, description: 'User profile details', type: UserProfile })
    @ApiResponse({ status: 403, description: 'No permission to view profile' })
    @ApiResponse({ status: 404, description: 'Profile not found' })
    async getProfile(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
        @Query('item_id') item_id?: string,
    ): Promise<UserProfile> {
        try {
            return await this.userProfilesService.getProfile(id, req.user, item_id);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Patch(':id')
    @Roles('user_profile_update')
    @ApiOperation({ summary: 'Update user profile details' })
    @ApiParam({ name: 'id', description: 'UUID of the user profile' })
    @ApiResponse({ status: 200, description: 'Updated user profile', type: UserProfile })
    @ApiResponse({ status: 404, description: 'User profile not found' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('profile_picture', {
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)/)) {
                return cb(new GlobalHttpException(ERROR_MESSAGES.INVALID_FILE_TYPE, 400), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 },
    }))
    async updateProfile(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
        @Body() updateDto: UpdateUserProfileDto,
        @UploadedFile() file?: Express.Multer.File,
    ): Promise<UserProfile> {
        try {
            return await this.userProfilesService.update(id, updateDto, req.user, file);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Post(':item_id/permission')
    @Roles('profile_permission_create')
    @ApiOperation({ summary: 'Request permission to view a profile for an item' })
    @ApiParam({ name: 'item_id', description: 'UUID of the item' })
    @ApiResponse({ status: 201, description: 'Permission request created', type: ProfileViewRequests })
    @ApiResponse({ status: 403, description: 'Invalid request or interaction' })
    async createPermissionRequest(
        @Req() req: AuthenticatedRequest,
        @Param('item_id', ParseUUIDPipe) item_id: string,
        // @Body() createDto: CreatePermissionRequestDto,
    ): Promise<ProfileViewRequests> {
        try {
            return await this.userProfilesService.createPermissionRequest(item_id, req.user.id);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Get(':item_id/permission')
    @Roles('profile_permission_list')
    @ApiOperation({ summary: 'List permission requests (incoming or outgoing)' })
    @ApiParam({ name: 'item_id', description: 'UUID of the item' })
    @ApiResponse({ status: 200, description: 'List of permission requests', type: [ProfileViewRequests] })
    @ApiQuery({ name: 'filters', description: 'Filters for requests', type: PermissionRequestFilterDto })
    async getPermissionRequests(
        @Query() filters: PermissionRequestFilterDto,
        @Param('item_id', ParseUUIDPipe) item_id: string,
        @Req() req: AuthenticatedRequest,
    ): Promise<{ requests: ProfileViewRequests[]; page_context: any }> {
        try {
            return await this.userProfilesService.getPermissionRequests(item_id, filters, req.user);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Get(':item_id/viewers')
    @Roles('profile_permission_viewers')
    @ApiOperation({ summary: 'List users with approved permission to view user profile' })
    @ApiResponse({ status: 200, type: [ProfileViewRequests] })
    @ApiParam({ name: 'item_id', description: 'UUID of the item' })
    @ApiQuery({ name: 'filters', type: ApprovePermissionRequestFilterDto })
    async getProfileViewers(
        @Query() filters: ApprovePermissionRequestFilterDto,
        @Param('item_id', ParseUUIDPipe) item_id: string,
        @Req() req: AuthenticatedRequest,
    ): Promise<{ viewers: ProfileViewRequests[]; page_context: any }> {
        try {
            return await this.userProfilesService.getProfileViewers(item_id, filters, req.user);
        }
        catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Patch(':permission_id/permission_status')
    @Roles('profile_permission_status_update')
    @ApiOperation({ summary: 'Update the status of a profile view permission request' })
    @ApiResponse({ status: 200, description: 'Request status updated', type: ProfileViewRequests })
    @ApiResponse({ status: 403, description: 'Not authorized to update status' })
    @ApiResponse({ status: 400, description: 'Invalid status transition' })
    @ApiParam({ name: 'permission_id', description: 'UUID of the permission request' })
    @ApiBody({ type: UpdateStatusProfileDto, description: 'New status for the permission request' })
    async updatePermissionRequestStatus(
        @Param('permission_id', ParseUUIDPipe) id: string,
        @Body() updateStatusDto: UpdateStatusProfileDto,
        @Req() req: AuthenticatedRequest,
    ): Promise<ProfileViewRequests> {
        try {
            return await this.userProfilesService.updatePermissionRequestStatus(
                id,
                req.user.id,
                updateStatusDto.status,
            );
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }
}