import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../../common/models/users.model';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthUser } from 'src/common/types/auth-user.type';
import { UserFilterDto } from './dto/user-filter.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';
import { Item } from 'src/common/models/item.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) { }

  async create(createUserDto: SignUpDto): Promise<User> {
    return this.userModel.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const data = await this.userModel.findOne({
      where: { email: email },
      raw: true,
    });

    return data;
  }

  async findAll(
    filters: UserFilterDto,
  ): Promise<{ data: User[]; total: number }> {
    const { search, page = 1, limit = 5 } = filters;

    const { rows: data, count: total } = await this.userModel.findAndCountAll({
      where: search ? { name: { [Op.iLike]: `%${search}%` } } : undefined,
      offset: (page - 1) * limit,
      limit,
      distinct: true,
      include: [
        {
          model: Item,
          as: 'items'
        }
      ],
      // group: Sequelize.col('items.type')
      // include: { all: true, nested: true }
      // include: [
      //   {
      //     model: Item,
      //     // required: false,
      //     // right: true,
      //     subQuery: false
      //   }
      // ],
    });

    return { data, total };
  }

  async me(id: string): Promise<User> {
    const user = await this.userModel.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findOneById(id: string): Promise<User> {
    const user = await this.userModel.findByPk(id, { raw: true });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const [rowsUpdated, updatedUsers] = await this.userModel.update(dto, {
      where: { id },
      returning: true,
    });

    if (rowsUpdated === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUsers[0];
  }

  async updateUserStatus(
    user_id: string,
    is_active: boolean,
    currentUser: AuthUser,
  ): Promise<User> {
    if (user_id === currentUser.id) {
      throw new ForbiddenException("You can't change your own status");
    }

    const [rowsUpdated, updatedUsers] = await this.userModel.update(
      { is_active },
      {
        where: { id: user_id },
        returning: true,
      },
    );

    if (rowsUpdated === 0) {
      throw new NotFoundException('User not found');
    }

    return updatedUsers[0];
  }
}
