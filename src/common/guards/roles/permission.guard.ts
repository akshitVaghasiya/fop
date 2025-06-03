import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/common/decorators/roles/roles.decorator';
import { AuthChild } from 'src/common/models/auth-child.model';
import { Role } from 'src/common/models/role.model';
import { User } from 'src/common/models/users.model';

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);


        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const userId: string = request.user.id;


        if (!userId) {
            return false;
        }

        const user = await User.findByPk(userId, {
            include: [
                {
                    model: Role,
                    as: 'auth_items',
                    attributes: ['auth_items', 'name'],
                    // required: false
                }
            ],
            raw: true,
            nest: true,
        });

        console.log("user-->", user);

        if (!user || !user.auth_items.auth_items) {
            return false;
        }

        request.user.role_name = user.auth_items.name;

        const userPermissions = user.auth_items.auth_items;

        const parentPermissions = await AuthChild.findAll({
            where: { child: requiredPermissions },
            attributes: ['parent'],
            raw: true,
        }).then(results => results.map(r => r.parent));

        console.log("parentPermissions-->", parentPermissions);

        return requiredPermissions.some(permission =>
            userPermissions.includes(permission) ||
            parentPermissions.some(parent => userPermissions.includes(parent))
        );
    }
}