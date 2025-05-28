import { Injectable } from '@nestjs/common';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { ItemFilterDto } from '../dto/item-filter.dto';
import { AuthUser } from 'src/common/types/auth-user.type';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { ITEM_IMAGE_FOLDER } from 'src/common/constants/path.constants';
import { Item } from 'src/common/models/item.model';
import { Op } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { UserRole } from 'src/common/models/users.model';
import { ItemInterests } from 'src/common/models/item-interest.model';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { GlobalHttpException } from 'src/common/exceptions/global-exception';
import { ItemStatus, ItemType } from 'src/common/types/enums/items.enum';
import { CreateFreeItemDto } from '../dto/create-free-item.dto';

type WhereType = {
    type?: string;
    status?: string;
    [Op.or]?: [
        { title: { [Op.iLike]: string } },
        { description: { [Op.iLike]: string } }
    ];
};

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
export class ItemsService {
    constructor(
        @InjectModel(Item)
        private readonly itemsModel: typeof Item,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    create(
        user: AuthUser,
        createItemDto: CreateItemDto,
        file?: Express.Multer.File,
    ): Promise<Item> {
        return new Promise(async (resolve, reject) => {
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
                    image_url: imageUrl,
                    user_id: user.id,
                });
                // console.log("item-->",item);

                resolve(item);
            } catch (error) {
                if (publicId) {
                    await this.cloudinaryService.deleteImage(publicId);
                }
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }

    createFreeItem(
        createItemDto: CreateFreeItemDto,
        file?: Express.Multer.File,
    ): Promise<Item> {
        return new Promise(async (resolve, reject) => {
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
                    type: ItemType.FREE,
                    ...createItemDto,
                    image_url: imageUrl,
                });

                resolve(item);
            } catch (error) {
                if (publicId) {
                    await this.cloudinaryService.deleteImage(publicId);
                }
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }

    findAll(
        filters: ItemFilterDto,
    ): Promise<{ items: Item[]; page_context: PageContext }> {
        return new Promise(async (resolve, reject) => {

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
                ...(type && { type }),
                ...(status && { status }),
                ...(search && {
                    [Op.or]: [
                        { title: { [Op.iLike]: `%${search}%` } },
                        { description: { [Op.iLike]: `%${search}%` } },
                    ],
                }),
            };

            try {
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

                resolve({ items: rows, page_context });

            } catch (error) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }

    async findSharedItems(
        user_id: string,
        filters: { page?: number; limit?: number; search?: string },
    ): Promise<{ items: Item[]; page_context: PageContext }> {
        return new Promise(async (resolve, reject) => {
            try {
                const { page = 1, limit = 5, search } = filters;
                const where: any = { status: 'COMPLETED' };
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
                resolve({ items: rows, page_context });
            } catch (error) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }

    findUserItems(
        user_id: string,
        filters: ItemFilterDto,
    ): Promise<{ items: Item[]; page_context: PageContext }> {
        return new Promise(async (resolve, reject) => {
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
                console.log("filters-->", filters);

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
                console.log("rows-->", rows);


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

                resolve({ items: rows, page_context });

            } catch (error) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }

    findOneById(id: string): Promise<Item> {
        return new Promise(async (resolve, reject) => {
            try {
                const item = await this.itemsModel.findByPk(id, { raw: true });
                if (!item) {
                    return reject({ error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 });
                }
                resolve(item);
            } catch (error) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }

    findOne(id: string, user: AuthUser): Promise<Item> {
        return new Promise(async (resolve, reject) => {
            try {
                const where: { id: string; user_id?: string } = { id };

                if (user.role !== UserRole.ADMIN) {
                    where.user_id = user.id;
                }

                const item = await this.itemsModel.findOne({
                    where
                    // where: { id, },
                    // include: [
                    //     {
                    //         model: User,
                    //         as: 'user',
                    //         attributes: { exclude: ['password'] },
                    //     },
                    //     {
                    //         model: ItemInterest,
                    //         as: 'interests',
                    //         // separate: true,
                    //         include: [
                    //             {
                    //                 model: User,
                    //                 as: "user",
                    //                 attributes: { exclude: ['password'] },
                    //             },
                    //         ],
                    //     },
                    //     {
                    //         model: ItemReceiver,
                    //         as: 'receiver',
                    //         // separate: true,
                    //         include: [
                    //             {
                    //                 model: User,
                    //                 as: 'receiver',
                    //                 attributes: { exclude: ['password'] },
                    //             },
                    //         ],
                    //     },
                    // ],
                });

                if (!item) {
                    return reject({ error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 });
                }
                resolve(item.dataValues);
            } catch (error) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }

    update(
        itemId: string,
        updateItemDto: UpdateItemDto,
        user: AuthUser,
        file?: Express.Multer.File,
    ): Promise<Item> {
        return new Promise(async (resolve, reject) => {

            let oldPublicId: string | undefined;
            let newPublicId: string | undefined;
            try {
                const item = await this.itemsModel.findByPk(itemId);

                if (!item) {
                    return reject({ error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 });
                }

                if (user.role !== UserRole.ADMIN && (item.getDataValue('user_id') !== user.id)) {
                    throw new GlobalHttpException(ERROR_MESSAGES.FORBIDDEN_OWNERSHIP, 403);
                }

                // if (updateItemDto.status === ItemStatus.REJECTED && user.role !== UserRole.ADMIN) {
                //     return reject({ error: 'only admin can rehect item', statusCode: 403 });
                // }

                // try {
                //     this.validateItemOwnership(user, item.dataValues);
                //     // this.validateItemOwnership(user, item.dataValues);
                // } catch (ownershipError) {
                //     return reject(ownershipError);
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

                await item.update({
                    ...updateItemDto,
                },);

                if (oldPublicId && newPublicId) {
                    await this.cloudinaryService.deleteImage(oldPublicId);
                }

                resolve(item);
            } catch (error) {
                if (newPublicId) {
                    await this.cloudinaryService.deleteImage(newPublicId);
                }
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }

    delete(itemId: string, user: AuthUser): Promise<{ message: string }> {
        return new Promise(async (resolve, reject) => {
            let publicId: string | undefined;
            try {
                const item = await this.itemsModel.findOne({ where: { id: itemId } });

                if (!item) {
                    return reject({ error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 });
                }

                try {
                    this.validateItemOwnership(user, item.dataValues);
                } catch (ownershipError) {
                    return reject(ownershipError);
                }

                const imageUrl = item.get('image_url');
                if (imageUrl) {

                    publicId = this.cloudinaryService.extractPublicIdFromUrl(imageUrl);
                }

                await item.destroy();

                if (publicId) {
                    await this.cloudinaryService.deleteImage(publicId);
                }

                resolve({ message: 'deleted successfully' });

            } catch (error) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }

    validateItemOwnership(user: AuthUser, item: Item): void {
        try {

            if (user.role !== UserRole.ADMIN && (item.user_id !== user.id)) {
                throw new GlobalHttpException(ERROR_MESSAGES.FORBIDDEN_OWNERSHIP, 403);
            }
        } catch (error) {
            throw error;
        }
    }
}