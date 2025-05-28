import { Inject, Injectable } from '@nestjs/common';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '../../common/models/users.model';
import { JwtService } from '@nestjs/jwt';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { InjectModel } from '@nestjs/sequelize';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Role } from 'src/common/models/role.model';
import { RolesService } from '../roles/roles.service';
import { UserProfile } from 'src/common/models/user-profile.model';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @Inject(RolesService)
    private readonly rolesService: RolesService,
  ) { }

  async register(signUpDto: SignUpDto): Promise<{ data: Omit<User, 'password'>; message: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        const existingUser = await this.userModel.findOne({
          where: { email: signUpDto.email },
          raw: true,
        });

        if (existingUser) {
          return reject({
            error: ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED,
            statusCode: 409,
          });
        }

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(signUpDto.password, salt);

        const createdUser = await this.userService.create({
          name: signUpDto.name,
          email: signUpDto.email,
          password: hashedPassword,
        });

        resolve({
          data: createdUser,
          message: 'User registered successfully',
        });
      } catch (err) {
        reject({
          error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
          statusCode: 500,
        });
      }
    });
  }

  async login(signInDto: SignInDto): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    refresh_expires_in: number;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await this.userModel.findOne({
          where: { email: signInDto.email },
          raw: true,
        });

        if (!user) {
          return reject({
            error: ERROR_MESSAGES.USER_NOT_FOUND,
            statusCode: 404,
          });
        }

        if (!user.is_active) {
          return reject({
            error: ERROR_MESSAGES.ACCOUNT_DEACTIVATED,
            statusCode: 403,
          });
        }

        const isValid = await bcrypt.compare(signInDto.password, user.password);
        if (!isValid) {
          return reject({
            error: ERROR_MESSAGES.INVALID_CREDENTIALS,
            statusCode: 401,
          });
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

        resolve({
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: Number(process.env.JWT_EXPIRE),
          refresh_token: refreshToken,
          refresh_expires_in: Number(process.env.JWT_REFRESH_EXPIRE),
        });
      } catch (err) {
        reject({
          error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
          statusCode: 500,
        });
      }
    });
  }

  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }> {
    return new Promise(async (resolve, reject) => {
      try {

        const payload = await this.jwtService.verifyAsync(refreshToken, {
          secret: process.env.JWT_REFRESH_SECRET,
        });

        const user = await this.userModel.findOne({
          where: { id: payload.id },
          raw: true,
        });

        if (!user) {
          return reject({
            error: ERROR_MESSAGES.USER_NOT_FOUND,
            statusCode: 404,
          });
        }

        if (!user.is_active) {
          return reject({
            error: ERROR_MESSAGES.ACCOUNT_DEACTIVATED,
            statusCode: 403,
          });
        }

        const newPayload = {
          id: user.id,
          name: user.name,
        };

        const newAccessToken = this.jwtService.sign(newPayload, {
          secret: process.env.JWT_SECRET,
          expiresIn: Number(process.env.JWT_EXPIRE),
        });

        resolve({
          access_token: newAccessToken,
          token_type: 'Bearer',
          expires_in: Number(process.env.JWT_EXPIRE),
        });
      } catch (err) {
        reject({
          error: ERROR_MESSAGES.INVALID_TOKEN,
          statusCode: 401,
        });
      }
    });
  }

  async userInfo(id: string): Promise<User> {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await this.userModel.findByPk(id, {
          include: [
            // { model: UserProfile, as: 'profile' },
            { model: Role, as: 'auth_items' },
          ],
          attributes: { exclude: ['password'] },
          raw: true,
          nest: true,
        });

        if (!user) {
          return reject({ error: ERROR_MESSAGES.USER_NOT_FOUND, statusCode: 404 });
        }

        const [formattedRole] = await this.rolesService.formatRoles([user.auth_items]);

        user.auth_items.auth_items = formattedRole.auth_items;

        resolve(user);
      } catch (error) {
        reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
      }
    });
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await this.userModel.findByPk(userId, { raw: true });
        if (!user) {
          return reject({
            error: ERROR_MESSAGES.USER_NOT_FOUND,
            statusCode: 404,
          });
        }

        const isMatch = await bcrypt.compare(changePasswordDto.oldPassword, user.password);

        if (!isMatch) {
          return reject({
            error: ERROR_MESSAGES.OLD_PASSWORD_INCORRECT,
            statusCode: 400,
          });
        }

        const salt = await bcrypt.genSalt();
        const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, salt);

        await this.userModel.update(
          { password: hashedNewPassword },
          { where: { id: userId } }
        );

        resolve({ message: 'Password changed successfully' });
      } catch (err) {
        reject({
          error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
          statusCode: 500,
        });
      }
    });
  }

}