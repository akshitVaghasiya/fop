import { Injectable } from '@nestjs/common';
import { UserFilterDto } from './modules/users/dto/user-filter.dto';
import { Item } from './common/models/item.model';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './common/models/users.model';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import sequelize from 'sequelize';

@Injectable()
export class AppService {

  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) { }

  async getHello(
    filters: UserFilterDto,
  ): Promise<any> {
    const { search, page = 1, limit = 5 } = filters;

    const data = await this.userModel.findAll({
      include: [
        {
          model: Item,
        }
      ],
      where: Sequelize.literal('1=1'),
      raw: true,
      nest: true  
    });
    // const data = await this.userModel.findAll({
    //   include: [
    //     {
    //       model: Item,
    //       as: 'items',
    //       attributes: ['id'],
    //       duplicating: false
    //     }
    //   ],
    //   attributes: ['id', 'name', 'email', [Sequelize.fn('COUNT', Sequelize.col('items.id')), 'itemCount']],

    //   group: ['users.id'],
    // });

    // const data = await this.userModel.findAll({
    //   where: search ? { name: { [Op.iLike]: `%${search}%` } } : undefined,
    //   offset: (page - 1) * limit,
    //   limit: 10,
    //   attributes: {
    //     include: [
    //       [Sequelize.fn('COUNT', Sequelize.col('items.id')), 'totalItem'],
    //       [Sequelize.literal(`SUM(CASE WHEN items.type = 'FREE' THEN 1 ELSE 0 END)`), 'freeItem'],
    //     ],
    //   },
    //   include: [
    //     {
    //       model: Item,
    //       as: 'items',
    //       attributes: []
    //     }
    //   ],
    //   group: ['User.id'],
    //   subQuery: false,
    //   order: [['freeItem', 'DESC'], ['name', 'ASC']]
    // });

    return data;
  }
}
