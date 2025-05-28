import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize, WhereOptions } from 'sequelize';
import { CreatePermissionRequestDto } from './dto/create-permission-request.dto';
import { Chat } from 'src/common/models/chat.model';
import { ItemInterests } from 'src/common/models/item-interest.model';
import { User, UserRole } from 'src/common/models/users.model';
import { Item } from 'src/common/models/item.model';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { PermissionRequestFilterDto } from './dto/permission-request-filter.dto';
import { AuthUser } from 'src/common/types/auth-user.type';
import { ApprovePermissionRequestFilterDto } from './dto/approve-permission-request-filter.dto';
import { ProfileViewRequests } from 'src/common/models/profile-view-request.model';

interface PageContext {
  page: number;
  limit: number;
  total: number;
  status?: string;
  item_id?: string;
}

@Injectable()
export class ProfilePermissionService {
  constructor(
    @InjectModel(Item) private readonly itemsModel: typeof Item,
    @InjectModel(User) private readonly usersModel: typeof User,
    @InjectModel(ItemInterests) private readonly itemInterestsModel: typeof ItemInterests,
    @InjectModel(Chat) private readonly chatModel: typeof Chat,
    @InjectModel(ProfileViewRequests)
    private readonly permissionRequestsModel: typeof ProfileViewRequests,
    @Inject('SEQUELIZE') private readonly sequelize: Sequelize,
  ) { }

  createPermissionRequest(dto: CreatePermissionRequestDto, requester_id: string): Promise<ProfileViewRequests> {
    return new Promise(async (resolve, reject) => {
      const transaction = await this.sequelize.transaction();
      try {
        console.log("dto-->", dto);
        console.log("requester_id-->", requester_id);

        const item = await this.itemsModel.findByPk(dto.item_id, { raw: true, nest: true, transaction });
        console.log("item-->", item);

        if (!item) {
          await transaction.rollback();
          return reject({ error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 });
        }
        // if (!['FOUND', 'FREE', 'LOST'].includes(item.type)) {
        //   await transaction.rollback();
        //   return reject({ error: ERROR_MESSAGES.INVALID_ITEM_TYPE, statusCode: 400 });
        // }
        console.log("item-->", item);
        console.log("dto-->", dto);

        if (item.user_id !== dto.owner_id) {
          await transaction.rollback();
          return reject({ error: ERROR_MESSAGES.INVALID_PERMISSION_REQUEST, statusCode: 403 });
        }
        // if (dto.requester_id !== requester_id) {
        //   await transaction.rollback();
        //   return reject({ error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 });
        // }
        if (requester_id === dto.owner_id) {
          await transaction.rollback();
          return reject({ error: ERROR_MESSAGES.REQUEST_TO_SELF_FORBIDDEN, statusCode: 403 });
        }

        if (dto.item_interest_id) {
          const interest = await this.itemInterestsModel.findByPk(dto.item_interest_id, { raw: true, nest: true, transaction });
          console.log("interest-->", interest);

          if (!interest || interest.item_id !== dto.item_id || interest.user_id !== requester_id) {
            await transaction.rollback();
            return reject({ error: ERROR_MESSAGES.INVALID_INTERACTION, statusCode: 403 });
          }
        } else if (dto.chat_id) {
          const chat = await this.chatModel.findByPk(dto.chat_id, { raw: true, nest: true, transaction });
          if (!chat || chat.item_id !== dto.item_id || chat.sender_id !== requester_id || chat.receiver_id !== dto.owner_id) {
            await transaction.rollback();
            return reject({ error: ERROR_MESSAGES.INVALID_INTERACTION, statusCode: 403 });
          }
        } else {
          await transaction.rollback();
          return reject({ error: ERROR_MESSAGES.INVALID_INTERACTION, statusCode: 400 });
        }

        const existingRequest = await this.permissionRequestsModel.findOne({
          where: {
            item_id: dto.item_id,
            requester_id: requester_id,
            [Op.or]: [{ status: 'PENDING' }, { status: 'APPROVED' }],
            ...(item.type !== 'LOST' && dto.item_interest_id ? { item_interest_id: dto.item_interest_id } : {}),
          },
          transaction,
        });
        if (existingRequest) {
          await transaction.rollback();
          return reject({ error: ERROR_MESSAGES.PERMISSION_ALREADY_REQUESTED, statusCode: 400 });
        }
        const request = await this.permissionRequestsModel.create(
          {
            item_id: dto.item_id,
            owner_id: dto.owner_id,
            requester_id: requester_id,
            item_interest_id: dto.item_interest_id,
            chat_id: dto.chat_id,
            status: 'PENDING',
          },
          { transaction },
        );
        await transaction.commit();
        resolve(request);
      } catch (err) {
        await transaction.rollback();
        reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
      }
    });
  }

  getPermissionRequests(
    filters: PermissionRequestFilterDto,
    user: AuthUser,
  ): Promise<{ requests: ProfileViewRequests[]; page_context: PageContext }> {
    return new Promise(async (resolve, reject) => {
      try {
        const { page = 1, limit = 10, status, item_id } = filters;
        const where: WhereOptions = {
          [Op.or]: [{ owner_id: user.id }, { requester_id: user.id }],
          ...(status && { status }),
          ...(item_id && { item_id }),
        };
        console.log("where-->", where);

        const { rows, count } = await this.permissionRequestsModel.findAndCountAll({
          where,
          include: [
            { model: Item, as: 'item' },
            // { model: User, as: 'owner', attributes: { exclude: ['password'] } },
            { model: User, as: 'requester', attributes: { exclude: ['password'] } },
            // { model: ItemInterests, as: 'item_interest' },
            // { model: Chat, as: 'chat' },
          ],
          offset: (page - 1) * limit,
          limit,
          raw: true,
          nest: true,
        });
        console.log("row-->", rows);

        const page_context: PageContext = {
          page,
          limit,
          total: count,
          ...(status && { status }),
          ...(item_id && { item_id }),
        };
        resolve({ requests: rows, page_context });
      } catch (err) {
        reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
      }
    });
  }

  approvePermissionRequest(id: string, user_id: string): Promise<ProfileViewRequests> {
    return new Promise(async (resolve, reject) => {
      const transaction = await this.sequelize.transaction();
      try {
        const request = await this.permissionRequestsModel.findByPk(id, { transaction });
        console.log("request-->", request?.getDataValue('owner_id'));
        console.log("user_id-->", user_id);

        if (!request) {
          await transaction.rollback();
          return reject({ error: ERROR_MESSAGES.PERMISSION_REQUEST_NOT_FOUND, statusCode: 404 });
        }
        if (request.getDataValue('owner_id') !== user_id) {
          await transaction.rollback();
          return reject({ error: ERROR_MESSAGES.NOT_REQUEST_OWNER, statusCode: 403 });
        }
        if (request.getDataValue('status') !== 'PENDING') {
          await transaction.rollback();
          return reject({ error: ERROR_MESSAGES.INVALID_PERMISSION_REQUEST_STATUS, statusCode: 400 });
        }
        await request.update({ status: 'APPROVED' }, { transaction });
        await transaction.commit();
        resolve(request);
      } catch (err) {
        await transaction.rollback();
        reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
      }
    });
  }

  denyPermissionRequest(id: string, user_id: string): Promise<ProfileViewRequests> {
    return new Promise(async (resolve, reject) => {
      const transaction = await this.sequelize.transaction();
      try {
        const request = await this.permissionRequestsModel.findByPk(id, { transaction });
        if (!request) {
          await transaction.rollback();
          return reject({ error: ERROR_MESSAGES.PERMISSION_REQUEST_NOT_FOUND, statusCode: 404 });
        }
        if (request.getDataValue('owner_id') !== user_id) {
          await transaction.rollback();
          return reject({ error: ERROR_MESSAGES.NOT_REQUEST_OWNER, statusCode: 403 });
        }
        if (request.getDataValue('status') !== 'PENDING') {
          await transaction.rollback();
          return reject({ error: ERROR_MESSAGES.INVALID_PERMISSION_REQUEST_STATUS, statusCode: 400 });
        }
        await request.update({ status: 'DENIED' }, { transaction });
        await transaction.commit();
        resolve(request);
      } catch (err) {
        await transaction.rollback();
        reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
      }
    });
  }

  rejectPermissionRequest(id: string, user_id: string): Promise<ProfileViewRequests> {
    return new Promise(async (resolve, reject) => {
      console.log("id-->", id);
      console.log("user_id-->", user_id);
      const t = await this.sequelize.transaction();
      try {
        const request = await this.permissionRequestsModel.findByPk(id, { transaction: t });
        console.log("request-->", request);

        if (!request) {
          return reject({ error: ERROR_MESSAGES.PERMISSION_REQUEST_NOT_FOUND, statusCode: 404 });
        }
        if (request.getDataValue('owner_id') !== user_id) {
          return reject({ error: ERROR_MESSAGES.NOT_REQUEST_OWNER, statusCode: 403 });
        }
        if (request.getDataValue('status') !== 'APPROVED') {
          return reject({ error: ERROR_MESSAGES.INVALID_PERMISSION_REQUEST_STATUS, statusCode: 400 });
        }

        await request.update({ status: 'DENIED' }, { transaction: t });
        await t.commit();
        resolve(request);
      } catch (err) {
        await t.rollback();
        reject({ error: err.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: err.statusCode || 500 });
      }
    });
  }

  getProfileViewers(
    filters: ApprovePermissionRequestFilterDto,
    user: AuthUser,
  ): Promise<{ viewers: ProfileViewRequests[]; page_context: PageContext }> {
    return new Promise(async (resolve, reject) => {
      try {
        const { page = 1, limit = 10, item_id } = filters;
        if (user.role !== UserRole.ADMIN && user.id !== filters.owner_id)
          return reject({ error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 });

        const where: WhereOptions = {
          owner_id: filters.owner_id || user.id,
          status: 'APPROVED',
          ...(item_id && { item_id }),
        };

        const { rows, count } = await this.permissionRequestsModel.findAndCountAll({
          where,
          include: [
            { model: Item, as: 'item', attributes: ['id', 'type', 'title'] },
            { model: User, as: 'requester', attributes: ['id', 'name', 'email'] },
          ],
          attributes: ['id', 'item_id', 'owner_id', 'requester_id', 'item_interest_id', 'chat_id', 'status', 'created_at'],
          offset: (page - 1) * limit,
          limit,
          raw: true,
          nest: true,
        });

        resolve({
          viewers: rows,
          page_context: { page, limit, total: count, status: 'APPROVED', ...(item_id && { item_id }) },
        });
      } catch (err) {
        reject({ error: err.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: err.statusCode || 500 });
      }
    });
  }
  
}