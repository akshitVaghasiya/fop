import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from 'src/common/models/role.model';
import { User } from 'src/common/models/users.model';
import { AuthItem } from 'src/common/models/auth-item.model';
import { AuthChild } from 'src/common/models/auth-child.model';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';

@Injectable()
export class RolesService {
    constructor(
        @InjectModel(Role)
        private readonly roleModel: typeof Role,
        @InjectModel(User)
        private readonly userModel: typeof User,
        @InjectModel(AuthItem)
        private readonly authItemModel: typeof AuthItem,
        @InjectModel(AuthChild)
        private readonly authChildModel: typeof AuthChild,
    ) { }

    async create(dto: CreateRoleDto): Promise<Role> {
        try {
            const role = await this.roleModel.create({
                name: dto.name,
                auth_items: [], // Empty auth_items as per requirement
            });
            return role;
        } catch (error) {
            throw { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 };
        }
    }

    async findAll(): Promise<any[]> {
        try {
            const roles = await this.roleModel.findAll({
                raw: true,
                attributes: ['id', 'name', 'auth_items']
            });
            return this.formatRoles(roles);
        } catch (error) {
            throw {
                error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: 500
            };
        }
    }

    // New reusable function that can be used for single/multiple roles
    public async formatRoles(roles: Role[]): Promise<any[]> {
        const [authChildren, authItems] = await Promise.all([
            this.authChildModel.findAll({ raw: true, attributes: ['parent', 'child'] }),
            this.authItemModel.findAll({ raw: true, attributes: ['name'] })
        ]);

        // Build parent-child relationships
        const parentMap = new Map<string, string[]>();
        const allChildren = new Set<string>();
        authChildren.forEach(({ parent, child }) => {
            if (!parentMap.has(parent)) parentMap.set(parent, []);
            parentMap.get(parent)!.push(child);
            allChildren.add(child);
        });

        // Categorize permissions
        const categories: Record<string, string[]> = {};
        const allPermissions = authItems.map(item => item.name);

        // Build category structure
        parentMap.forEach((children, parent) => {
            categories[parent] = children.filter(child =>
                allPermissions.includes(child)
            );
        });

        return roles.map(role => this.processRole(role, parentMap, categories));
    }

    // Reusable role processing function
    private processRole(
        role: Role,
        parentMap: Map<string, string[]>,
        categories: Record<string, string[]>
    ) {
        const rolePermissions = new Set(role.auth_items || []);

        // Expand parent permissions to include children
        role.auth_items?.forEach(permission => {
            if (parentMap.has(permission)) {
                parentMap.get(permission)!.forEach(child =>
                    rolePermissions.add(child)
                );
            }
        });

        // Build nested auth_items structure
        const authItemsStructure = {};
        Object.entries(categories).forEach(([category, permissions]) => {
            authItemsStructure[category] = permissions.reduce((acc, perm) => {
                acc[perm] = rolePermissions.has(perm);
                return acc;
            }, {});
        });

        return {
            id: role.id,
            name: role.name,
            auth_items: authItemsStructure
        };
    }

    async update(id: string, dto: UpdateRoleDto): Promise<Role> {
        try {
            const role = await this.roleModel.findByPk(id);
            if (!role) {
                throw { error: ERROR_MESSAGES.ROLE_NOT_FOUND, statusCode: 404 };
            }
            const [rowsUpdated, [updatedRole]] = await this.roleModel.update(dto, {
                where: { id },
                returning: true,
            });
            if (rowsUpdated === 0) {
                throw { error: ERROR_MESSAGES.ROLE_NOT_FOUND, statusCode: 404 };
            }
            return updatedRole;
        } catch (error) {
            if (error.statusCode) throw error;
            throw { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 };
        }
    }

    async delete(id: string): Promise<{ message: string }> {
        try {
            const role = await this.roleModel.findByPk(id);
            if (!role) {
                throw { error: ERROR_MESSAGES.ROLE_NOT_FOUND, statusCode: 404 };
            }
            const userCount = await this.userModel.count({ where: { role_id: id } });
            if (userCount > 0) {
                throw { error: ERROR_MESSAGES.ROLE_IN_USE, statusCode: 400 };
            }
            await this.roleModel.destroy({ where: { id } });
            return { message: 'Role deleted successfully' };
        } catch (error) {
            if (error.statusCode) throw error;
            throw { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 };
        }
    }

    private transformAuthItems(roleAuthItems: string[], categories: { [key: string]: string[] }): any {
        const result = {};
        for (const [category, permissions] of Object.entries(categories)) {
            if (permissions.length > 0) {
                result[category] = {};
                for (const perm of permissions) {
                    result[category][perm] = roleAuthItems.includes(perm);
                }
            }
        }
        return result;
    }
}