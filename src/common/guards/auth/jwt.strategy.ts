import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../../modules/users/users.service';
import { UserDeactivatedException } from '../../exceptions/user-deactivated.exception';
import { AuthUser } from '../../types/auth-user.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private usersService: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET!,
        });
    }

    async validate(payload: AuthUser) {
        const user = await this.usersService.findOneById(payload.id);
        // console.log("userJWT-->", user);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        if (!user.is_active) {
            throw new UserDeactivatedException({
                message: 'Account deactivated',
                code: 'USER_DEACTIVATED',
            });
        }
        return user;
    }
}