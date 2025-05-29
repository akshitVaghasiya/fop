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

@ApiTags('User Profiles')
@ApiBearerAuth()
@Controller('user_profiles')
export class UserProfileController {
    constructor(private readonly userProfilesService: UserProfileService) { }

    @Post()
    // @Roles(UserRole.USER)
    @Roles('user_profile_create')
    @UseGuards(PermissionGuard)
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
            console.log("file-->", file);
            return await this.userProfilesService.create(createDto, req.user, file);
        } catch (err) {
            console.log("err->", err);

            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Get()
    // @Roles(UserRole.ADMIN)
    @Roles('user_profile_list')
    @UseGuards(PermissionGuard)
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
    // @Roles(UserRole.ADMIN, UserRole.USER)
    @Roles('user_profile_view')
    @UseGuards(PermissionGuard)
    @ApiOperation({ summary: 'Get a user profile (item_id optional for self/admin)' })
    @ApiParam({ name: 'id', description: 'UUID of the user profile' })
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
    // @Roles(UserRole.ADMIN, UserRole.USER)
    @Roles('user_profile_update')
    @UseGuards(PermissionGuard)
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
            console.log("file-->", file);

            return await this.userProfilesService.update(id, updateDto, req.user, file);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }
}