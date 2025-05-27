import { Injectable } from '@nestjs/common';
import { User, UserRole } from '../../common/models/users.model';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthUser } from 'src/common/types/auth-user.type';
import { UserFilterDto } from './dto/user-filter.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Item } from 'src/common/models/item.model';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';

type PageContext = {
  page: number;
  limit: number;
  total: number;
  type?: string;
  status?: string;
  search?: string;
  sort_by?: string;
  sort_type?: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) { }

  create(createUserDto: SignUpDto): Promise<User> {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await this.userModel.create({
          name: createUserDto.name,
          email: createUserDto.email,
          password: createUserDto.password,
        });
        resolve(user);
      } catch (error) {
        reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
      }
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return new Promise(async (resolve, reject) => {
      try {
        const data = await this.userModel.findOne({
          where: { email },
          raw: true,
        });
        resolve(data);
      } catch (error) {
        reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
      }
    });
  }

  findAll(filters: UserFilterDto): Promise<{ users: User[]; page_context: PageContext }> {
    return new Promise(async (resolve, reject) => {
      try {

        const { search, page = 1, limit = 5 } = filters;
        const where = search
          ? { name: { [Op.iLike]: `%${search}%` } }
          : undefined;

        const { rows, count } = await this.userModel.findAndCountAll({
          where,
          offset: (page - 1) * limit,
          limit,
          distinct: true,
          include: [
            {
              model: Item,
              as: 'items',
            },
          ],
        });

        const page_context: PageContext = {
          page,
          limit,
          total: count,
          ...(search && { search }),
        };

        resolve({ users: rows, page_context });

      } catch (error) {
        reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
      }
    });
  }

  findOneById(id: string): Promise<User> {
    return new Promise(async (resolve, reject) => {
      try {
        const user = await this.userModel.findByPk(id, { raw: true });
        if (!user) {
          return reject({ error: ERROR_MESSAGES.USER_NOT_FOUND, statusCode: 404 });
        }
        resolve(user);
      } catch (error) {
        reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
      }
    });
  }

  updateUser(id: string, dto: UpdateUserDto, user: AuthUser): Promise<User> {
    return new Promise(async (resolve, reject) => {
      try {

        if (user.role !== UserRole.ADMIN && user.id !== id) {
          return reject({ error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 });
        }

        if (user.role !== UserRole.ADMIN) {
          if ('role' in dto) {
            delete dto.role;
          }
        }

        const [rowsUpdated, updatedUsers] = await this.userModel.update(dto, {
          where: { id },
          returning: true,
        });
        if (rowsUpdated === 0) {
          return reject({ error: ERROR_MESSAGES.USER_NOT_FOUND, statusCode: 404 });
        }
        resolve(updatedUsers[0]);
      } catch (error) {
        reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
      }
    });
  }

  updateUserStatus(
    user_id: string,
    is_active: boolean,
    currentUser: AuthUser,
  ): Promise<User> {
    return new Promise(async (resolve, reject) => {
      try {
        if (user_id === currentUser.id) {
          return reject({
            error: ERROR_MESSAGES.FORBIDDEN_SELF_STATUS_CHANGE,
            statusCode: 403,
          });
        }
        const [rowsUpdated, updatedUsers] = await this.userModel.update(
          { is_active },
          {
            where: { id: user_id },
            returning: true,
          },
        );
        if (rowsUpdated === 0) {
          return reject({ error: ERROR_MESSAGES.USER_NOT_FOUND, statusCode: 404 });
        }
        resolve(updatedUsers[0]);
      } catch (error) {
        reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
      }
    });
  }
}