import { Inject, Injectable } from '@nestjs/common';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../../common/models/users.model';
import { JwtService } from '@nestjs/jwt';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { InjectModel } from '@nestjs/sequelize';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Role } from 'src/common/models/role.model';
import { RolesService } from '../roles/roles.service';

interface JwtPayload {
  id: string;
  name: string;
  [key: string]: unknown;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Role)
    private roleModel: typeof Role,
    @Inject(RolesService)
    private readonly rolesService: RolesService,
  ) { }

  async register(signUpDto: SignUpDto): Promise<{ data: Omit<User, 'password'>; message: string }> {
    try {
      const existingUser = await this.userModel.findOne({
        where: { email: signUpDto.email },
        raw: true,
      });

      if (existingUser) {
        throw {
          error: ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED,
          statusCode: 409,
        };
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(signUpDto.password, salt);

      const createdUser = await this.userModel.create({
        name: signUpDto.name,
        email: signUpDto.email,
        password: hashedPassword,
      });

      return {
        data: createdUser,
        message: 'User registered successfully',
      };
    } catch (error) {
      throw {
        error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        statusCode: error?.statusCode || 500,
      };
    }
  }

  async login(signInDto: SignInDto): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    refresh_expires_in: number;
  }> {
    try {
      const user = await this.userModel.scope('withPassword').findOne({
        where: { email: signInDto.email },
        raw: true,
      });

      if (!user) {
        throw {
          error: ERROR_MESSAGES.USER_NOT_FOUND,
          statusCode: 404,
        };
      }

      if (!user.is_active) {
        throw {
          error: ERROR_MESSAGES.ACCOUNT_DEACTIVATED,
          statusCode: 403,
        };
      }

      const isValid = await bcrypt.compare(signInDto.password, user.password);
      if (!isValid) {
        throw {
          error: ERROR_MESSAGES.INVALID_CREDENTIALS,
          statusCode: 401,
        };
      }

      const payload = {
        id: user.id,
        name: user.name,
      };

      const accessToken = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: Number(process.env.JWT_EXPIRE),
      });

      const refreshToken = this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: Number(process.env.JWT_REFRESH_EXPIRE),
      });

      return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: Number(process.env.JWT_EXPIRE),
        refresh_token: refreshToken,
        refresh_expires_in: Number(process.env.JWT_REFRESH_EXPIRE),
      };
    } catch (error) {
      throw {
        error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        statusCode: error?.statusCode || 500,
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }> {
    try {
      let payload: JwtPayload;
      try {
        payload = await this.jwtService.verifyAsync(refreshToken, {
          secret: process.env.JWT_REFRESH_SECRET,
        });
      } catch (error) {
        throw {
          error: ERROR_MESSAGES.INVALID_TOKEN,
          statusCode: 400
        }
      }

      const user = await this.userModel.findOne({
        where: { id: payload.id },
        raw: true,
      });

      if (!user) {
        throw {
          error: ERROR_MESSAGES.USER_NOT_FOUND,
          statusCode: 404,
        };
      }

      if (!user.is_active) {
        throw {
          error: ERROR_MESSAGES.ACCOUNT_DEACTIVATED,
          statusCode: 403,
        };
      }

      const newPayload = {
        id: user.id,
        name: user.name,
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        secret: process.env.JWT_SECRET,
        expiresIn: Number(process.env.JWT_EXPIRE),
      });

      return {
        access_token: newAccessToken,
        token_type: 'Bearer',
        expires_in: Number(process.env.JWT_EXPIRE),
      };
    } catch (error) {
      console.log("error-->", error);

      throw {
        error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        statusCode: error?.statusCode || 500,
      };
    }
  }

  async userInfo(id: string): Promise<User> {
    try {
      const user = await this.userModel.scope('withAuthItem').findByPk(id, {
        include: [
          {
            model: this.roleModel.scope('withDetail'),
            as: 'auth_items'
          },
        ],
        raw: true,
        nest: true,
      });

      if (!user) {
        throw { error: ERROR_MESSAGES.USER_NOT_FOUND, statusCode: 404 };
      }
      if (user.auth_items) {
        const [formattedRole] = await this.rolesService.formatRoles([user.auth_items]);

        user.auth_items.auth_items = formattedRole.auth_items;
      }

      return user;
    } catch (error) {
      console.log('Error-->', error);
      throw {
        error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        statusCode: error?.statusCode || 500,
      };
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    try {
      const user = await this.userModel.scope("withPassword").findByPk(userId, { raw: true });
      if (!user) {
        throw {
          error: ERROR_MESSAGES.USER_NOT_FOUND,
          statusCode: 404,
        };
      }

      const isMatch = await bcrypt.compare(changePasswordDto.oldPassword, user.password);

      if (!isMatch) {
        throw {
          error: ERROR_MESSAGES.OLD_PASSWORD_INCORRECT,
          statusCode: 400,
        };
      }

      const salt = await bcrypt.genSalt();
      const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, salt);

      await this.userModel.update(
        { password: hashedNewPassword },
        { where: { id: userId } }
      );

      return { message: 'Password changed successfully' };
    } catch (err) {
      throw {
        error: err?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        statusCode: err?.statusCode || 500,
      };
    }
  }

}