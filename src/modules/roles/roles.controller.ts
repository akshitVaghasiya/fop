import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from 'src/common/models/role.model';
import { GlobalHttpException } from 'src/common/exceptions/global-exception';
import { PermissionGuard } from 'src/common/guards/roles/permission.guard';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Post()
    @Roles('role_create')
    @ApiOperation({ summary: 'Create a new role' })
    @ApiResponse({ status: 201, description: 'Role created', type: Role })
    async create(@Body() createDto: CreateRoleDto): Promise<Role> {
        try {
            return await this.rolesService.create(createDto);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Get()
    @Roles('role_view')
    @ApiOperation({ summary: 'Get all roles' })
    @ApiResponse({ status: 200, description: 'List of all roles' })
    async findAll(): Promise<any[]> {
        try {
            return await this.rolesService.findAll();
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Patch(':id')
    @Roles('role_update')
    @ApiOperation({ summary: 'Update a role' })
    @ApiParam({ name: 'id', description: 'UUID of the role' })
    @ApiResponse({ status: 200, description: 'Updated role', type: Role })
    @ApiResponse({ status: 404, description: 'Role not found' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateRoleDto,
    ): Promise<Role> {
        try {
            return await this.rolesService.update(id, updateDto);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }

    @Delete(':id')
    @Roles('role_delete')
    @ApiOperation({ summary: 'Delete a role' })
    @ApiParam({ name: 'id', description: 'UUID of the role' })
    @ApiResponse({ status: 200, description: 'Role deleted' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    @ApiResponse({ status: 400, description: 'Role is in use' })
    async delete(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
        try {
            return await this.rolesService.delete(id);
        } catch (err) {
            throw new GlobalHttpException(err.error, err.statusCode);
        }
    }
}