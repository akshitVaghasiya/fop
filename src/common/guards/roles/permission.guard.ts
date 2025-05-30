import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { log } from 'console';
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

        // console.log("requiredPermissions-->", requiredPermissions);

        if (!requiredPermissions || requiredPermissions.length === 0) {
            // return true;
        }

        const request = context.switchToHttp().getRequest();
        const userId: string = request.user.id;

        // console.log("userId-->", userId);

        if (!userId) {
            return false;
        }

        const user = await User.findByPk(userId, {
            include: [
                {
                    model: Role,
                    as: 'auth_items',
                    attributes: ['auth_items'],
                    // required: false
                }
            ],
            raw: true,
            nest: true,
        });

        // console.log("user-->", user);


        // console.log("user-->", user);

        if (!user || !user.role || !user.auth_items.auth_items) {
            return false;
        }

        const userPermissions = user.auth_items.auth_items;
        // const userPermissions = user.role;
        // console.log("userPermissions-->", userPermissions);
        const parentPermissions = await AuthChild.findAll({
            where: { child: requiredPermissions },
            attributes: ['parent'],
            raw: true,
        }).then(results => results.map(r => r.parent));

        // console.log("parentPermissions-->", parentPermissions);

        return requiredPermissions.some(permission =>
            userPermissions.includes(permission) ||
            parentPermissions.some(parent => userPermissions.includes(parent))
        );
    }
}