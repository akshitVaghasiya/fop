import { Injectable } from '@nestjs/common';
import { UserFilterDto } from './modules/users/dto/user-filter.dto';
import { Item } from './common/models/item.model';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './common/models/users.model';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import sequelize from 'sequelize';
import { UserPreference } from './common/models/user-preference.model';
import { ERROR_MESSAGES } from './common/constants/error-response.constant';
import { AuthChild } from './common/models/auth-child.model';
import { AuthItem } from './common/models/auth-item.model';

@Injectable()
export class AppService {

  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(UserPreference)
    private userPreferenceModel: typeof UserPreference,
    @InjectModel(AuthChild)
    private authChildModel: typeof AuthChild,
    @InjectModel(AuthItem)
    private authItemModel: typeof AuthItem,
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
      // where: Sequelize.literal('1=1'),
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


  async userPreference() {
    return "no data to insert";
    // const staticData = {
    //   user_id: 'c6cbf611-dc6e-4552-bdf9-703f80ab63b7',
    //   preferred_categories: ['electronics', 'clothing'],
    //   search_filters: { location: 'library', max_distance_km: 5 },
    //   metadata: { theme: 'dark', source: 'api' },
    //   max_budget: 50.99,
    // };

    // const staticData = {
    //   user_id: '4e9805d8-13d2-4401-86b3-7a470c2c3a11',
    //   preferred_categories: ['books', 'accessories'],
    //   search_filters: [
    //     { location: 'park', max_distance_km: 10 },
    //     { location: 'library', item_condition: 'new' },
    //   ],
    //   metadata: { theme: 'light', source: 'api-alt' },
    //   max_budget: 75.50,
    // };
    const staticData = {
      user_id: '272262ab-e443-423e-ad3b-a25e87e8170b',
      preferred_categories: ['electronics', 'furniture'],
      search_filters: [
        { location: 'downtown', max_distance_km: 5 },
        { location: 'university', item_condition: 'used' },
      ],
      metadata: [
        { key: 'theme', value: 'dark' },
        { key: 'source', value: 'mobile-app' },
        { key: 'notifications', value: 'enabled' }
      ],
      max_budget: 120.00,
    };

    return this.userPreferenceModel.create(staticData);
  }

  async getUserPreference() {
    const data = await this.userPreferenceModel.findAll({
      // where: Sequelize.json('metadata.theme', 'light'),
      where: Sequelize.where(
        Sequelize.cast('search_filters', 'jsonb'),
        '@>',
        [{ location: 'university' }]
      ),
      // where: {
      //   preferred_categories: {
      //     [Op.contains]: ['clothing']
      //   }
      // },
      // where: {
      //   search_filters: {
      //     [Op.contains]: [{ location: 'university' }]
      //   }
      // },
      // where: Sequelize.where(Sequelize.literal('[{ "location": "university" }]'), Sequelize.fn('ANY', Sequelize.col('search_filters'))),
      // where: Sequelize.where(
      //   Sequelize.literal(`search_filters #>> '{details,age}'`),
      //   '25'
      // )
      // where: {
      //   metadata: { [Op.contains]: [{ key: 'source' }] }
      // preferred_categories: { [Op.overlap]: ['books', 'clothing'] }
      //   [Op.and]: [
      //     {
      //       metadata: {
      //         theme: 'light'
      //       }
      //     }
      //   ]
      // },

      // where: {
      //   search_filters: {
      //     [Op.contains]: [{ location: 'ary' }],
      //   },
      // },

      // where: {
      //   [Op.and]: [
      //     sequelize.literal(`search_filters @> '[{"location": "ary"}]'`),
      //     sequelize.literal(`search_filters::jsonb #>> '{0,location}' ILIKE 'ary'`),
      //   ]
      // }

      // where: {
      //   [Op.and]: [
      //     sequelize.where(
      //       sequelize.json('search_filters.location'),
      //       'LIKE',
      //       '%park%'
      //     ),
      //   ],
      // },
      raw: true
    });

    // data.forEach((obj) => {
    //   obj.item_list = `Items for user ${obj.user_id}`;
    // });

    // const result = data.map((pref) => {
    //   const plain = pref.toJSON();
    //   plain.item_list = `Items for user ${plain.user_id}`;
    //   return plain;
    // });

    return data;
  }

  async distinct() {
    const data = this.userModel.findAll({
      include: [{
        model: Item,
      }],
      // distinct: true,
    });

    return data;
  }

  async raw() {

    return new Promise(async (resolve, reject) => {
      try {
        const data = await this.userModel.findAll({
          include: [{
            model: Item,
          }],
          // nest: true,
          // raw: false
        });

        // return data;
        resolve(data);
      } catch (error) {
        reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
      }
    });

  }

  async cross() {
    const data = await this.userModel.findAndCountAll({
      distinct: true,
      include: {
        model: Item,
        required: true,
        on: sequelize.literal('1=1')
      },
      raw: true,
      nest: true
    });

    return data;
  }
}
