import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../../modules/users/users.service';
import { AuthUser } from '../../types/auth-user.type';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';

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

        if (!user) {
            throw { error: ERROR_MESSAGES.USER_NOT_FOUND, statusCode: 404 };
        }
        if (!user.is_active) {
            throw { error: ERROR_MESSAGES.USER_DEACTIVATED, statusCode: 403 };
        }
        return user;
    }
}