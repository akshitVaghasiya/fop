import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProfilePermissionService } from './profile-permission.service';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { UserRole } from 'src/common/models/users.model';
import { ProfileViewRequests } from 'src/common/models/profile-view-permission.model';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request.type';
import { CreatePermissionRequestDto } from './dto/create-permission-request.dto';
import { GlobalHttpException } from 'src/common/exceptions/global-exception';
import { PermissionRequestFilterDto } from './dto/permission-request-filter.dto';
import { ApprovePermissionRequestFilterDto } from './dto/approve-permission-request-filter.dto';
import { PermissionGuard } from 'src/common/guards/roles/permission.guard';


@ApiTags('Profile Permissions')
@ApiBearerAuth()
@Controller('profile-permissions')
export class ProfilePermissionController {
    constructor(private readonly profilePermissionService: ProfilePermissionService) { }

    @Post()
    // @Roles(UserRole.ADMIN, UserRole.USER)
    @Roles('profile_permission_create')
    @UseGuards(PermissionGuard)
    @ApiOperation({ summary: 'Request permission to view a profile for an item' })
    @ApiResponse({ status: 201, description: 'Permission request created', type: ProfileViewRequests })
    @ApiResponse({ status: 403, description: 'Invalid request or interaction' })
    async createPermissionRequest(
        @Req() req: AuthenticatedRequest,
        @Body() createDto: CreatePermissionRequestDto,
    ): Promise<ProfileViewRequests> {
        try {
            return await this.profilePermissionService.createPermissionRequest(createDto, req.user.id);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Get()
    // @Roles(UserRole.ADMIN, UserRole.USER)
    @Roles('profile_permission_list')
    @UseGuards(PermissionGuard)
    @ApiOperation({ summary: 'List permission requests (incoming or outgoing)' })
    @ApiResponse({ status: 200, description: 'List of permission requests', type: [ProfileViewRequests] })
    @ApiQuery({ name: 'filters', description: 'Filters for requests', type: PermissionRequestFilterDto })
    async getPermissionRequests(
        @Query() filters: PermissionRequestFilterDto,
        @Req() req: AuthenticatedRequest,
    ): Promise<{ requests: ProfileViewRequests[]; page_context: any }> {
        try {
            return await this.profilePermissionService.getPermissionRequests(filters, req.user);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Get('viewers')
    // @Roles(UserRole.ADMIN, UserRole.USER)
    @Roles('profile_permission_viewers')
    @UseGuards(PermissionGuard)
    @ApiOperation({ summary: 'List users with approved permission to view user profile' })
    @ApiResponse({ status: 200, type: [ProfileViewRequests] })
    @ApiQuery({ name: 'filters', type: ApprovePermissionRequestFilterDto })
    async getProfileViewers(
        @Query() filters: ApprovePermissionRequestFilterDto,
        @Req() req: AuthenticatedRequest,
    ): Promise<{ viewers: ProfileViewRequests[]; page_context: any }> {
        try { return await this.profilePermissionService.getProfileViewers(filters, req.user); }
        catch (err) { throw new GlobalHttpException(err.error, err.statusCode); }
    }

    @Patch(':id/approve')
    // @Roles(UserRole.ADMIN, UserRole.USER)
    @Roles('profile_permission_approve')
    @UseGuards(PermissionGuard)
    @ApiOperation({ summary: 'Approve a profile view permission request' })
    @ApiResponse({ status: 200, description: 'Request approved', type: ProfileViewRequests })
    @ApiResponse({ status: 403, description: 'Not authorized to approve' })
    @ApiParam({ name: 'id', description: 'UUID of the permission request' })
    async approvePermissionRequest(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ): Promise<ProfileViewRequests> {
        try {
            return await this.profilePermissionService.approvePermissionRequest(id, req.user.id);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Patch(':id/deny')
    // @Roles(UserRole.ADMIN, UserRole.USER)
    @Roles('profile_permission_deny')
    @UseGuards(PermissionGuard)
    @ApiOperation({ summary: 'Deny a profile view permission request' })
    @ApiResponse({ status: 200, description: 'Request denied', type: ProfileViewRequests })
    @ApiResponse({ status: 403, description: 'Not authorized to deny' })
    @ApiParam({ name: 'id', description: 'UUID of the permission request' })
    async denyPermissionRequest(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ): Promise<ProfileViewRequests> {
        try {
            return await this.profilePermissionService.denyPermissionRequest(id, req.user.id);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Patch(':id/reject')
    // @Roles(UserRole.ADMIN, UserRole.USER).
    @Roles('profile_permission_reject')
    @UseGuards(PermissionGuard)
    @ApiOperation({ summary: 'Reject (revoke) an approved profile view permission' })
    @ApiResponse({ status: 200, type: ProfileViewRequests })
    @ApiResponse({ status: 403, description: 'Not authorized to reject' })
    @ApiParam({ name: 'id', description: 'UUID of the permission request' })
    async rejectPermissionRequest(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ): Promise<ProfileViewRequests> {
        try { return await this.profilePermissionService.rejectPermissionRequest(id, req.user.id); }
        catch (err) { throw new GlobalHttpException(err.error, err.statusCode); }
    }
}