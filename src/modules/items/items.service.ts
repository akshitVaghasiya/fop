import { Inject, Injectable } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemFilterDto } from './dto/item-filter.dto';
import { AuthUser } from 'src/common/types/auth-user.type';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { ITEM_IMAGE_FOLDER } from 'src/common/constants/path.constants';
import { Item } from 'src/common/models/item.model';
import { literal, Op, Sequelize, WhereOptions } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { ItemInterests } from 'src/common/models/item-interest.model';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { GlobalHttpException } from 'src/common/exceptions/global-exception';
import { ItemType, ItemStatus } from 'src/common/types/enums/items.enum';
import { CreateFreeItemDto } from './dto/create-free-item.dto';
import { isAdminRole } from 'src/common/utils/role.util';
import { User } from 'src/common/models/users.model';
import { ItemInterestFilterDto } from './dto/item-interest-filter.dto';

type WhereType = {
    type?: string;
    status?: ItemStatus | { [key: symbol]: any };
    [Op.or]?: [
        { title: { [Op.iLike]: string } },
        { description: { [Op.iLike]: string } }
    ];
};

interface PageContext {
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
export class ItemsService {
    constructor(
        @InjectModel(Item)
        private readonly itemsModel: typeof Item,
        private readonly cloudinaryService: CloudinaryService,
        @InjectModel(ItemInterests) private readonly itemInterestsModel: typeof ItemInterests,
        @InjectModel(User) private readonly usersModel: typeof User,
        @Inject('SEQUELIZE') private readonly sequelize: Sequelize,
        // private readonly profilePermissionService: ProfilePermissionService,

    ) { }

    async create(
        user: AuthUser,
        createItemDto: CreateItemDto,
        file?: Express.Multer.File,
    ): Promise<Item> {
        let imageUrl: string | undefined;
        let publicId: string | undefined;
        try {
            if (file) {
                const folder = ITEM_IMAGE_FOLDER;
                const uploaded = await this.cloudinaryService.uploadImage(file, folder);
                imageUrl = uploaded.secure_url;
                publicId = uploaded.public_id;
            }
            // let locationData;
            // if (createItemDto.location && createItemDto.location.length === 2) {
            //     const [longitude, latitude] = createItemDto.location;
            //     locationData = literal(`POINT(${longitude}, ${latitude})`);
            // }

            const item = await this.itemsModel.create({
                ...createItemDto,
                location: createItemDto.location ? literal(`POINT(${createItemDto.location[0]}, ${createItemDto.location[1]})`) : null,
                image_url: imageUrl,
                user_id: user.id,
            });

            return item;
        } catch (error) {
            if (publicId) {
                await this.cloudinaryService.deleteImage(publicId);
            }
            throw {
                error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: error?.statusCode || 500,
            };
        }
    }

    async createFreeItem(
        createItemDto: CreateFreeItemDto,
        file?: Express.Multer.File,
    ): Promise<Item> {
        let imageUrl: string | undefined;
        let publicId: string | undefined;
        try {
            if (file) {
                const folder = ITEM_IMAGE_FOLDER;
                const uploaded = await this.cloudinaryService.uploadImage(file, folder);
                imageUrl = uploaded.secure_url;
                publicId = uploaded.public_id;
            }
            const item = await this.itemsModel.create({
                ...createItemDto,
                type: ItemType.FREE,
                location: createItemDto.location ? literal(`POINT(${createItemDto.location[0]}, ${createItemDto.location[1]})`) : null,
                image_url: imageUrl,
                user_id: null
            });

            return item;
        } catch (error) {
            if (publicId) {
                await this.cloudinaryService.deleteImage(publicId);
            }
            throw {
                error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: error?.statusCode || 500,
            };
        }
    }

    async findAll(
        filters: ItemFilterDto,
    ): Promise<{ items: Item[]; page_context: PageContext }> {
        try {
            const {
                page = 1,
                limit = 5,
                type,
                status,
                search,
                sort_by = 'created_at',
                sort_type = 'DESC',
            } = filters;

            const where: WhereType = {
                // ...(status && { status }),
                status: status ? status : { [Op.in]: [ItemStatus.ACTIVE, ItemStatus.COMPLETED] },
                ...(type && { type }),
                ...(search && {
                    [Op.or]: [
                        { title: { [Op.iLike]: `%${search}%` } },
                        { description: { [Op.iLike]: `%${search}%` } },
                    ],
                }),
            };

            const { rows, count } = await this.itemsModel.findAndCountAll({
                where,
                order: [[sort_by, sort_type]],
                offset: (page - 1) * limit,
                limit,
            });

            const page_context: PageContext = {
                page,
                limit,
                total: count,
                ...(type && { type }),
                ...(status && { status }),
                ...(search && { search }),
                ...(filters.sort_by && { sort_by: filters.sort_by }),
                ...(filters.sort_type && { sort_type: filters.sort_type }),
            };

            return { items: rows, page_context };
        } catch (error) {
            throw {
                error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: error?.statusCode || 500,
            };
        }
    }

    async findSharedItems(
        user_id: string,
        filters: { page?: number; limit?: number; search?: string },
    ): Promise<{ items: Item[]; page_context: PageContext }> {
        try {
            const { page = 1, limit = 5, search } = filters;
            const where: any = { status: ItemStatus.COMPLETED };
            if (search) {
                where[Op.or] = [{ title: { [Op.iLike]: `%${search}%` } }];
            }
            const { rows, count } = await this.itemsModel.findAndCountAll({
                where,
                include: [
                    {
                        model: ItemInterests,
                        as: 'interests',
                        where: { user_id, assigned_by: { [Op.ne]: null } },
                        required: true,
                    },
                ],
                order: [['created_at', 'DESC']],
                offset: (page - 1) * limit,
                limit,
            });
            const page_context: PageContext = { page, limit, total: count, ...(search && { search }) };
            return { items: rows, page_context };
        } catch (error) {
            throw {
                error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: error?.statusCode || 500,
            };
        }
    }

    async findUserItems(
        user_id: string,
        filters: ItemFilterDto,
    ): Promise<{ items: Item[]; page_context: PageContext }> {
        const {
            page = 1,
            limit = 5,
            type,
            status,
            search,
            sort_by = 'created_at',
            sort_type = 'DESC',
        } = filters;

        const where: {
            user_id: string;
            type?: string;
            status?: string;
            [Op.or]?: { [key: string]: { [key: symbol]: string } }[];
        } = { user_id };

        if (filters.type) where.type = type;
        if (filters.status) where.status = status;
        if (search) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${filters.search}%` } },
                { description: { [Op.iLike]: `%${filters.search}%` } },
            ];
        }

        try {
            const { rows, count } = await this.itemsModel.findAndCountAll({
                where,
                distinct: true,
                include: [
                    // {
                    //     model: User,
                    //     as: 'user',
                    //     attributes: ['id', 'name', 'email'],
                    // },
                    {
                        model: ItemInterests,
                        as: 'interests',
                    },
                ],
                order: [[sort_by, sort_type]],
                offset: (page - 1) * limit,
                limit,
            });

            const page_context: PageContext = {
                page,
                limit,
                total: count,
                ...(type && { type }),
                ...(status && { status }),
                ...(search && { search }),
                ...(filters.sort_by && { sort_by: filters.sort_by }),
                ...(filters.sort_type && { sort_type: filters.sort_type }),
            };

            return { items: rows, page_context };
        } catch (error) {
            throw {
                error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: error?.statusCode || 500,
            };
        }
    }

    async findOneById(id: string): Promise<Item> {
        try {
            const item = await this.itemsModel.findByPk(id, { raw: true });
            if (!item) {
                throw { error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 };
            }
            return item;
        } catch (error) {
            throw {
                error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: error?.statusCode || 500,
            };
        }
    }

    async findOne(id: string, user: AuthUser): Promise<Item> {
        try {
            const where: { id: string; user_id?: string } = { id };

            if (!isAdminRole(user.role_name)) {
                where.user_id = user.id;
            }

            const item = await this.itemsModel.findOne({
                where
            });

            if (!item) {
                throw { error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 };
            }
            return item.dataValues;
        } catch (error) {
            throw {
                error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: error?.statusCode || 500,
            };
        }
    }

    async update(
        itemId: string,
        updateItemDto: UpdateItemDto,
        user: AuthUser,
        file?: Express.Multer.File,
    ): Promise<Item> {
        let oldPublicId: string | undefined;
        let newPublicId: string | undefined;
        try {
            const item = await this.itemsModel.findByPk(itemId);

            if (!item) {
                throw { error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 };
            }

            if (!isAdminRole(user.role_name) && (item.getDataValue('user_id') !== user.id)) {
                throw new GlobalHttpException(ERROR_MESSAGES.FORBIDDEN_OWNERSHIP, 403);
            }

            // if (updateItemDto.status === ItemStatus.REJECTED && !isAdminRole(user.role_name)) {
            //     throw { error: 'only admin can rehect item', statusCode: 403 };
            // }

            // try {
            //     this.validateItemOwnership(user, item.dataValues);
            //     // this.validateItemOwnership(user, item.dataValues);
            // } catch (ownershipError) {
            //     throw ownershipError;
            // }

            if (file) {
                if (item.image_url) {
                    oldPublicId = this.cloudinaryService.extractPublicIdFromUrl(item.image_url);
                }
                const folder = ITEM_IMAGE_FOLDER;
                const uploaded = await this.cloudinaryService.uploadImage(file, folder);
                updateItemDto.image_url = uploaded.secure_url;
                newPublicId = uploaded.public_id;
            }
            const locationLiteral = updateItemDto.location
                ? literal(`POINT(${updateItemDto.location[0]}, ${updateItemDto.location[1]})`)
                : undefined;

            await item.update({
                ...updateItemDto,
                ...(locationLiteral && { location: locationLiteral }),
            });

            if (oldPublicId && newPublicId) {
                await this.cloudinaryService.deleteImage(oldPublicId);
            }

            return item;
        } catch (error) {
            if (newPublicId) {
                await this.cloudinaryService.deleteImage(newPublicId);
            }
            throw {
                error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: error?.statusCode || 500,
            };
        }
    }

    async rejectItem(itemId: string, user: AuthUser): Promise<{ message: string }> {
        try {
            // if (!isAdminRole(user.role_name)) {
            //     throw { error: ERROR_MESSAGES.FORBIDDEN_OWNERSHIP, statusCode: 403 };
            // }

            const item = await this.itemsModel.findOne({ where: { id: itemId }, raw: true });

            if (!item) {
                throw { error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 };
            }

            if (item.status !== ItemStatus.ACTIVE) {
                throw { error: ERROR_MESSAGES.ACTIVE_ITEM_NOT_FOUND, statusCode: 404 };
            }

            await this.itemsModel.update(
                { status: ItemStatus.REJECTED },
                { where: { id: itemId } },
            );

            return { message: 'rejected successfully' };
        } catch (error) {
            throw {
                error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: error?.statusCode || 500,
            };
        }
    }

    async delete(itemId: string, user: AuthUser): Promise<{ message: string }> {
        let publicId: string | undefined;
        try {
            const item = await this.itemsModel.findOne({ where: { id: itemId, status: ItemStatus.ACTIVE } });

            if (!item) {
                throw { error: ERROR_MESSAGES.ACTIVE_ITEM_NOT_FOUND, statusCode: 404 };
            }

            try {
                this.validateItemOwnership(user, item.dataValues);
            } catch (ownershipError) {
                throw ownershipError;
            }

            const imageUrl = item.get('image_url');
            if (imageUrl) {
                publicId = this.cloudinaryService.extractPublicIdFromUrl(imageUrl);
            }

            await item.destroy();

            if (publicId) {
                await this.cloudinaryService.deleteImage(publicId);
            }

            return { message: 'deleted successfully' };
        } catch (error) {
            throw {
                error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: error?.statusCode || 500,
            };
        }
    }

    validateItemOwnership(user: AuthUser, item: Item): void {
        try {
            if (!isAdminRole(user.role_name) && (item.user_id !== user.id)) {
                throw new GlobalHttpException(ERROR_MESSAGES.FORBIDDEN_OWNERSHIP, 403);
            }
        } catch (error) {
            throw error;
        }
    }

    async createInterest(item_id: string, user_id: string): Promise<ItemInterests> {
        try {
            const item = await this.itemsModel.findOne({
                where: { id: item_id, type: { [Op.in]: [ItemType.FOUND, ItemType.FREE] }, status: ItemStatus.ACTIVE },
                raw: true,
                nest: true,
            });
            if (!item) {
                throw { error: ERROR_MESSAGES.ACTIVE_ITEM_NOT_FOUND, statusCode: 404 };
            }

            if (item.user_id === user_id) {
                throw { error: ERROR_MESSAGES.OWNER_CANNOT_EXPRESS_INTEREST, statusCode: 403 };
            }
            const existingInterest = await this.itemInterestsModel.findOne({
                where: { item_id: item_id, user_id },
            });
            if (existingInterest) {
                throw { error: ERROR_MESSAGES.INTEREST_ALREADY_EXPRESSED, statusCode: 403 };
            }
            const interest = await this.itemInterestsModel.create(
                { item_id: item_id, user_id },
            );

            return interest;
        } catch (err) {
            throw {
                error: err?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: err?.statusCode || 500
            };
        }
    }

    async getInterests(
        item_id: string,
        filters: ItemInterestFilterDto,
        user: AuthUser,
    ): Promise<{ interests: ItemInterests[]; page_context: PageContext }> {
        try {
            const { page = 1, limit = 10, search } = filters;
            const item = await this.itemsModel.findByPk(item_id, { raw: true, nest: true });

            if (!item) {
                throw { error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 };
            }
            if (!isAdminRole(user.role_name) && item.user_id !== user.id) {
                throw { error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 };
            }
            const where: WhereOptions = { item_id };
            const userInclude = {
                model: User,
                as: 'user',
                ...(search && {
                    where: { name: { [Op.iLike]: `%${search}%` } },
                }),
            };
            const { rows, count } = await this.itemInterestsModel.findAndCountAll({
                where,
                include: [userInclude, { model: Item, as: 'item' }],
                offset: (page - 1) * limit,
                limit,
            });
            const page_context: PageContext = {
                page,
                limit,
                total: count,
                ...(search && { search }),
            };
            return { interests: rows, page_context };
        } catch (err) {
            throw {
                error: err?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: err?.statusCode || 500,
            };
        }
    }

    async assignReceiver(id: string, user: AuthUser): Promise<{ message: string }> {
        const transaction = await this.sequelize.transaction();
        try {
            const interest = await this.itemInterestsModel.findByPk(id, {
                include: [{ model: Item, as: 'item' }],
                raw: true,
                nest: true,
                transaction,
            });

            if (!interest) {
                throw { error: ERROR_MESSAGES.INTEREST_NOT_FOUND, statusCode: 404 };
            }

            const item = interest.item;

            if (item.status !== ItemStatus.ACTIVE) {
                throw { error: ERROR_MESSAGES.ITEM_NOT_ACTIVE, statusCode: 400 };
            }
            if (item.type === ItemType.FREE && !isAdminRole(user.role_name)) {
                throw { error: ERROR_MESSAGES.ADMIN_ONLY, statusCode: 403 };
            }
            if (item.type === ItemType.FOUND && !isAdminRole(user.role_name) && item.user_id !== user.id) {
                throw { error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 };
            }
            if (item.type !== ItemType.FOUND && item.type !== ItemType.FREE) {
                throw { error: ERROR_MESSAGES.INVALID_ITEM_TYPE, statusCode: 400 };
            }

            const receiver = await this.usersModel.findOne({
                where: { id: interest.user_id },
                transaction,
            });

            if (!receiver) {
                throw { error: ERROR_MESSAGES.RECEIVER_USER_NOT_FOUND, statusCode: 404 };
            }
            if (item.user_id === interest.user_id) {
                throw { error: ERROR_MESSAGES.ASSIGN_TO_OWNER_FORBIDDEN, statusCode: 403 };
            }
            // if (interest.user_id !== interest.user_id) {
            //     await transaction.rollback();
            //     throw { error: ERROR_MESSAGES.INVALID_INTEREST, statusCode: 403 };
            // }
            const existingAssignment = await this.itemInterestsModel.findOne({
                where: { item_id: item.id, assigned_by: { [Op.ne]: null } },
                transaction,
            });

            if (existingAssignment) {
                throw { error: ERROR_MESSAGES.ITEM_ALREADY_ASSIGNED, statusCode: 400 };
            }

            await this.itemInterestsModel.update(
                { assigned_by: user.id },
                { where: { id }, transaction },
            );

            await this.itemsModel.update(
                { status: ItemStatus.COMPLETED },
                { where: { id: item.id }, transaction },
            );

            // const updatedInterest = await this.itemInterestsModel.findByPk(id, {
            //     transaction,
            // });
            // if (!updatedInterest) {
            //     await transaction.rollback();
            //     throw { error: ERROR_MESSAGES.INTEREST_NOT_FOUND, statusCode: 404 };
            // }

            await transaction.commit();
            return { message: 'item assigned successfully' };
        } catch (err) {
            await transaction.rollback();
            throw {
                error: err?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: err?.statusCode || 500,
            };
        }
    }
}