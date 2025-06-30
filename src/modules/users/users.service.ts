import { Injectable } from '@nestjs/common';
import { User } from '../../common/models/users.model';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthUser } from 'src/common/types/auth-user.type';
import { UserFilterDto } from './dto/user-filter.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Item } from 'src/common/models/item.model';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { isAdminRole } from 'src/common/utils/role.util';

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

  async create(createUserDto: SignUpDto): Promise<User> {
    try {
      const user = await this.userModel.create({
        name: createUserDto.name,
        email: createUserDto.email,
        password: createUserDto.password,
      });
      return user;
    } catch (err) {
      throw {
        error: err?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        statusCode: err?.statusCode || 500,
      };
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const data = await this.userModel.findOne({
        where: { email },
        raw: true,
      });
      return data;
    } catch (err) {
      throw {
        error: err?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        statusCode: err?.statusCode || 500,
      };
    }
  }

  async findAll(filters: UserFilterDto): Promise<{ users: User[]; page_context: PageContext }> {
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

      return { users: rows, page_context };
    } catch (err) {
      throw {
        error: err?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        statusCode: err?.statusCode || 500,
      };
    }
  }

  async findOneById(id: string): Promise<User> {
    try {
      const user = await this.userModel.findByPk(id, { raw: true });
      if (!user) {
        throw { error: ERROR_MESSAGES.USER_NOT_FOUND, statusCode: 404 };
      }
      return user;
    } catch (err) {
      throw {
        error: err?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        statusCode: err?.statusCode || 500,
      };
    }
  }

  async updateUser(id: string, dto: UpdateUserDto, user: AuthUser): Promise<User> {
    try {
      console.log("update user dto-->", dto);

      if (!isAdminRole(user.role_name) && user.id !== id) {
        throw { error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 };
      }

      if (!isAdminRole(user.role_name)) {
        if ('role' in dto) {
          delete dto.role;
        }
        if ('role_id' in dto) {
          delete dto.role_id;
        }
      }

      const [rowsUpdated, updatedUsers] = await this.userModel.update(dto, {
        where: { id },
        returning: true,
      });
      if (rowsUpdated === 0) {
        throw { error: ERROR_MESSAGES.USER_NOT_FOUND, statusCode: 404 };
      }
      return updatedUsers[0];
    } catch (err) {
      throw {
        error: err?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        statusCode: err?.statusCode || 500,
      };
    }
  }

  async updateUserStatus(
    user_id: string,
    is_active: boolean,
    currentUser: AuthUser,
  ): Promise<User> {
    try {
      if (user_id === currentUser.id) {
        throw {
          error: ERROR_MESSAGES.FORBIDDEN_SELF_STATUS_CHANGE,
          statusCode: 403,
        };
      }
      const [rowsUpdated, updatedUsers] = await this.userModel.update(
        { is_active },
        {
          where: { id: user_id },
          returning: true,
        },
      );
      if (rowsUpdated === 0) {
        throw { error: ERROR_MESSAGES.USER_NOT_FOUND, statusCode: 404 };
      }
      return updatedUsers[0];
    } catch (err) {
      throw {
        error: err?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        statusCode: err?.statusCode || 500,
      };
    }
  }

}