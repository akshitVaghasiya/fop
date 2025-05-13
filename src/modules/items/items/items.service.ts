import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { ItemFilterDto } from '../dto/item-filter.dto';
import { AuthUser } from 'src/common/types/auth-user.type';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { ITEM_IMAGE_FOLDER } from 'src/common/constants/path.constants';
import { Item } from 'src/common/models/item.model';
import { Op } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/common/models/users.model';
import { ItemInterest } from 'src/common/models/item-interest.model';
import { ItemReceiver } from 'src/common/models/item-receiver.model';

@Injectable()
export class ItemsService {
    constructor(
        @InjectModel(Item)
        private readonly itemsModel: typeof Item,
        private readonly cloudinaryService: CloudinaryService,
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

            const item = await this.itemsModel.create({
                ...createItemDto,
                image_url: imageUrl,
                user_id: user.id,
            });

            return item;
        } catch (error) {
            if (publicId) {
                await this.cloudinaryService.deleteImage(publicId);
            }
            throw new Error('Item creation failed. Rolled back image upload.');
        }
    }

    async findAll(
        filters: ItemFilterDto,
    ): Promise<{ data: Item[]; total: number }> {
        const where: any = {};

        if (filters.type) {
            where.type = filters.type;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.search) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${filters.search}%` } },
                { description: { [Op.iLike]: `%${filters.search}%` } },
            ];
        }

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 5;

        const { rows, count } = await this.itemsModel.findAndCountAll({
            where,
            offset: (page - 1) * limit,
            limit,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        return { data: rows, total: count };
    }

    async findSharedItems(
        user_id: string,
        filters: { page?: number; limit?: number; search?: string },
    ): Promise<{ data: Item[]; total: number }> {
        console.log('user_id-->', user_id);

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 5;

        const where: { status: string;[Op.or]?: object[] } = {
            status: 'CLAIMED',
        };

        if (filters.search) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${filters.search}%` } },
                { description: { [Op.iLike]: `%${filters.search}%` } },
            ];
        }

        const { rows, count } = await this.itemsModel.findAndCountAll({
            where,
            include: [
                {
                    association: 'receivers',
                    where: { receiver_user_id: user_id },
                    required: true,
                },
            ],
            offset: (page - 1) * limit,
            limit,
        });

        return { data: rows, total: count };
    }

    async findUserItems(
        user_id: string,
        filters: ItemFilterDto,
    ): Promise<{ data: Item[]; total: number }> {
        const where: any = { user_id };

        if (filters.type) {
            where.type = filters.type;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.search) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${filters.search}%` } },
                { description: { [Op.iLike]: `%${filters.search}%` } },
            ];
        }

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 5;

        const { rows, count } = await this.itemsModel.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: ItemInterest,
                    as: "interests"
                },
                {
                    model: ItemReceiver,
                    as: "receiver"
                }
            ],
            offset: (page - 1) * limit,
            limit,
        });

        return { data: rows, total: count };
    }

    async findOne(id: string): Promise<Item> {
        // const item = await this.itemsModel.findOne({
        //     where: { id },
        //     include: [
        //         {
        //             model: User,
        //             attributes: { exclude: ['password'] }
        //         },
        //         {
        //             model: ItemInterest,
        //         },
        //         {
        //             model: ItemReceiver
        //         },
        //     ],
        // });

        const item = await this.itemsModel.findOne({
            where: { id },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: { exclude: ['password'] },
                    // required: true, // for inner join
                },
                {
                    model: ItemInterest,
                    as: 'interests',
                    separate: true,
                    include: [
                        {
                            model: User,
                            attributes: { exclude: ['password'] }
                        }
                    ]
                },
                {
                    model: ItemReceiver,
                    as: 'receivers',
                    separate: true,
                    include: [
                        {
                            model: User,
                            as: 'receiver',
                            attributes: { exclude: ['password'] }
                        }
                    ]
                },
            ],
        });

        if (!item) {
            throw new NotFoundException(`Item with ID ${id} not found`);
        }

        return item.dataValues;
    }

    async update(
        itemId: string,
        updateItemDto: UpdateItemDto,
        file?: Express.Multer.File,
    ): Promise<Item> {
        let oldPublicId: string | undefined;
        let newPublicId: string | undefined;

        try {
            const item = await this.itemsModel.findByPk(itemId);
            if (!item) {
                throw new NotFoundException(`Item with ID ${itemId} not found`);
            }

            if (file) {
                if (item.image_url) {
                    oldPublicId = this.cloudinaryService.extractPublicIdFromUrl(
                        item.image_url,
                    );
                }
                const folder = ITEM_IMAGE_FOLDER;
                const uploaded = await this.cloudinaryService.uploadImage(file, folder);
                console.log('uploaded-->', uploaded);

                updateItemDto.image_url = uploaded.secure_url;
                newPublicId = uploaded.public_id;
            }

            await item.update(updateItemDto);

            if (oldPublicId && newPublicId) {
                await this.cloudinaryService.deleteImage(oldPublicId);
            }

            return item;
        } catch (error) {
            if (newPublicId) {
                await this.cloudinaryService.deleteImage(newPublicId);
            }
            throw new Error('Item update failed');
        }
    }

    async delete(itemId: string, user: AuthUser): Promise<string> {
        let publicId: string | undefined;

        try {
            const item = await this.itemsModel.findOne({
                where: { id: itemId },
            });

            if (!item) {
                throw new NotFoundException(`Item with ID ${itemId} not found`);
            }

            if (item.image_url) {
                publicId = this.cloudinaryService.extractPublicIdFromUrl(
                    item.image_url,
                );
            }

            await item.destroy();

            if (publicId) {
                await this.cloudinaryService.deleteImage(publicId);
            }

            return 'deleted successfully';
        } catch (error) {
            console.error('Error during item deletion:', error.message);
            throw new Error('Item deletion failed');
        }
    }
}
