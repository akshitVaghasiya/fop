import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProfilePermissionService } from './profile-permission.service';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { UserRole } from 'src/common/models/users.model';
import { ProfileViewPermissionRequests } from 'src/common/models/profile-view-permission.model';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request.type';
import { CreatePermissionRequestDto } from './dto/create-permission-request.dto';
import { GlobalHttpException } from 'src/common/exceptions/global-exception';
import { PermissionRequestFilterDto } from './dto/permission-request-filter.dto';
import { ApprovePermissionRequestFilterDto } from './dto/approve-permission-request-filter.dto';


@ApiTags('Profile Permissions')
@ApiBearerAuth()
@Controller('profile-permissions')
export class ProfilePermissionController {
    constructor(private readonly profilePermissionService: ProfilePermissionService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({ summary: 'Request permission to view a profile for an item' })
    @ApiResponse({ status: 201, description: 'Permission request created', type: ProfileViewPermissionRequests })
    @ApiResponse({ status: 403, description: 'Invalid request or interaction' })
    async createPermissionRequest(
        @Req() req: AuthenticatedRequest,
        @Body() createDto: CreatePermissionRequestDto,
    ): Promise<ProfileViewPermissionRequests> {
        try {
            return await this.profilePermissionService.createPermissionRequest(createDto, req.user.id);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({ summary: 'List permission requests (incoming or outgoing)' })
    @ApiResponse({ status: 200, description: 'List of permission requests', type: [ProfileViewPermissionRequests] })
    @ApiQuery({ name: 'filters', description: 'Filters for requests', type: PermissionRequestFilterDto })
    async getPermissionRequests(
        @Query() filters: PermissionRequestFilterDto,
        @Req() req: AuthenticatedRequest,
    ): Promise<{ requests: ProfileViewPermissionRequests[]; page_context: any }> {
        try {
            return await this.profilePermissionService.getPermissionRequests(filters, req.user);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Get('viewers')
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({ summary: 'List users with approved permission to view user profile' })
    @ApiResponse({ status: 200, type: [ProfileViewPermissionRequests] })
    @ApiQuery({ name: 'filters', type: ApprovePermissionRequestFilterDto })
    async getProfileViewers(
        @Query() filters: ApprovePermissionRequestFilterDto,
        @Req() req: AuthenticatedRequest,
    ): Promise<{ viewers: ProfileViewPermissionRequests[]; page_context: any }> {
        try { return await this.profilePermissionService.getProfileViewers(filters, req.user); }
        catch (err) { throw new GlobalHttpException(err.error, err.statusCode); }
    }

    @Patch(':id/approve')
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({ summary: 'Approve a profile view permission request' })
    @ApiResponse({ status: 200, description: 'Request approved', type: ProfileViewPermissionRequests })
    @ApiResponse({ status: 403, description: 'Not authorized to approve' })
    @ApiParam({ name: 'id', description: 'UUID of the permission request' })
    async approvePermissionRequest(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ): Promise<ProfileViewPermissionRequests> {
        try {
            return await this.profilePermissionService.approvePermissionRequest(id, req.user.id);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Patch(':id/deny')
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({ summary: 'Deny a profile view permission request' })
    @ApiResponse({ status: 200, description: 'Request denied', type: ProfileViewPermissionRequests })
    @ApiResponse({ status: 403, description: 'Not authorized to deny' })
    @ApiParam({ name: 'id', description: 'UUID of the permission request' })
    async denyPermissionRequest(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ): Promise<ProfileViewPermissionRequests> {
        try {
            return await this.profilePermissionService.denyPermissionRequest(id, req.user.id);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Patch(':id/reject')
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({ summary: 'Reject (revoke) an approved profile view permission' })
    @ApiResponse({ status: 200, type: ProfileViewPermissionRequests })
    @ApiResponse({ status: 403, description: 'Not authorized to reject' })
    @ApiParam({ name: 'id', description: 'UUID of the permission request' })
    async rejectPermissionRequest(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ): Promise<ProfileViewPermissionRequests> {
        try { return await this.profilePermissionService.rejectPermissionRequest(id, req.user.id); }
        catch (err) { throw new GlobalHttpException(err.error, err.statusCode); }
    }
}