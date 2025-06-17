import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProfilePictureMetadata, UserProfile } from 'src/common/models/user-profile.model';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserProfileFilterDto } from './dto/user-profile-filter.dto';
import { AuthUser } from 'src/common/types/auth-user.type';
import { Op, Sequelize, WhereOptions } from 'sequelize';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { User } from 'src/common/models/users.model';
import { Item } from 'src/common/models/item.model';
import { ProfileViewRequests } from 'src/common/models/profile-view-request.model';
import { isAdminRole } from 'src/common/utils/role.util';
import { Chat } from 'src/common/models/chat.model';
import { ItemInterests } from 'src/common/models/item-interest.model';
import { ItemType } from 'src/common/types/enums/items.enum';
import { ProfileViewStatus } from 'src/common/types/enums/profile-view-request.enum';
import { PermissionRequestFilterDto } from './dto/permission-request-filter.dto';
import { ApprovePermissionRequestFilterDto } from './dto/approve-permission-request-filter.dto';

type PageContext = {
    page: number;
    limit: number;
    total: number;
    search?: string;
    status?: string;
    item_id?: string;
};

@Injectable()
export class UserProfileService {
    constructor(
        @InjectModel(UserProfile)
        private readonly userProfileModel: typeof UserProfile,
        @InjectModel(ProfileViewRequests)
        private readonly permissionRequestsModel: typeof ProfileViewRequests,
        @InjectModel(Item) private readonly itemsModel: typeof Item,
        @InjectModel(User) private readonly usersModel: typeof User,
        @InjectModel(ItemInterests) private readonly itemInterestsModel: typeof ItemInterests,
        @InjectModel(Chat) private readonly chatModel: typeof Chat,
        @Inject('SEQUELIZE') private readonly sequelize: Sequelize,
    ) { }

    async create(dto: CreateUserProfileDto, user: AuthUser, file?: Express.Multer.File): Promise<UserProfile> {
        try {
            const existingProfile = await this.userProfileModel.findOne({
                where: { user_id: user.id },
            });

            if (existingProfile) {
                throw { error: 'User profile already exists', statusCode: 400 };
            }

            let profilePictureMetadata: ProfilePictureMetadata | null = null;
            if (file) {
                profilePictureMetadata = {
                    name: file.originalname,
                    mimeType: file.mimetype,
                    encoding: file.encoding,
                }
            }

            const profile = await this.userProfileModel.create({
                ...dto,
                user_id: user.id,
                profile_picture: file ? file.buffer : null,
                profile_picture_metadata: profilePictureMetadata,
            });

            const { profile_picture, profile_picture_metadata, ...profileWithoutPicture } = profile.toJSON();

            return profileWithoutPicture;
        } catch (error) {
            throw {
                error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: error?.statusCode || 500,
            };
        }
    }

    async findAll(filters: UserProfileFilterDto): Promise<{ profiles: UserProfile[]; page_context: PageContext }> {
        try {
            const { search, page = 1, limit = 5 } = filters;
            const where = search
                ? {
                    [Op.or]: [
                        { address: { [Op.iLike]: `%${search}%` } },
                        { bio: { [Op.iLike]: `%${search}%` } },
                    ],
                }
                : undefined;

            const { rows, count } = await this.userProfileModel.findAndCountAll({
                where,
                offset: (page - 1) * limit,
                limit,
                distinct: true,
                include: [{ model: User, as: 'user' }],
            });

            const page_context: PageContext = {
                page,
                limit,
                total: count,
                ...(search && { search }),
            };

            return { profiles: rows, page_context };
        } catch (error) {
            throw {
                error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: error?.statusCode || 500,
            };
        }
    }

    async getProfile(id: string, user: AuthUser, item_id?: string): Promise<any> {
        try {
            if (user && (user.id === id || isAdminRole(user.role_name))) {
                const profile = await this.userProfileModel.findOne({
                    where: { user_id: id }
                });

                if (!profile) {
                    throw { error: ERROR_MESSAGES.PROFILE_NOT_FOUND, statusCode: 404 };
                }

                return profile;
            }

            if (!item_id) {
                throw { error: ERROR_MESSAGES.NO_PROFILE_PERMISSION, statusCode: 403 };
            }

            const [permissionWithItem, profile] = await Promise.all([
                this.permissionRequestsModel.findOne({
                    where: {
                        owner_id: id,
                        requester_id: user?.id,
                        item_id,
                        status: 'APPROVED',
                    },
                    include: [{
                        model: Item,
                        as: 'item',
                        attributes: ['id', 'status'],
                        required: true
                    }],
                    attributes: ['id', 'status'],
                    raw: true,
                    nest: true,
                }),
                this.userProfileModel.findOne({
                    where: { user_id: id }
                })
            ]);

            if (!permissionWithItem) {
                throw { error: ERROR_MESSAGES.NO_PROFILE_PERMISSION, statusCode: 403 };
            }

            const item = permissionWithItem.item;
            if (item.status === 'COMPLETED' || item.status === 'REJECTED') {
                throw { error: ERROR_MESSAGES.ITEM_NOT_ACTIVE, statusCode: 400 };
            }

            if (!profile) {
                throw { error: ERROR_MESSAGES.PROFILE_NOT_FOUND, statusCode: 404 };
            }

            return profile;
        } catch (error) {
            console.log('error->', error);
            throw {
                error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: error?.statusCode || 500,
            };
        }
    }

    async update(id: string, dto: UpdateUserProfileDto, user: AuthUser, file?: Express.Multer.File): Promise<UserProfile> {
        try {
            const profile = await this.userProfileModel.findByPk(id, { raw: true, nest: true });

            if (!profile) {
                throw { error: ERROR_MESSAGES.PROFILE_NOT_FOUND, statusCode: 404 };
            }

            if (!isAdminRole(user.role_name) && profile.user_id !== user.id) {
                throw { error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 };
            }

            let profilePictureMetadata: ProfilePictureMetadata | null = null;
            if (file) {
                profilePictureMetadata = {
                    name: file.originalname,
                    mimeType: file.mimetype,
                    encoding: file.encoding,
                }
            }

            const [rowsUpdated, updatedProfiles] = await this.userProfileModel.update(
                {
                    ...dto,
                    profile_picture: file ? file.buffer : null,
                    profile_picture_metadata: profilePictureMetadata,
                },
                {
                    where: { id },
                    returning: true,
                });

            if (rowsUpdated === 0) {
                throw { error: 'User profile not found', statusCode: 404 };
            }

            return updatedProfiles[0];
        } catch (error) {
            throw {
                error: error?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: error?.statusCode || 500,
            };
        }
    }

    async createPermissionRequest(item_id: string, requester_id: string): Promise<ProfileViewRequests> {
        const transaction = await this.sequelize.transaction();
        try {
            const item = await this.itemsModel.findByPk(item_id, { raw: true, nest: true, transaction });
            if (!item) {
                await transaction.rollback();
                throw { error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 };
            }

            // if (item.user_id !== dto.owner_id) {
            //   await transaction.rollback();
            //   throw { error: ERROR_MESSAGES.INVALID_PERMISSION_REQUEST, statusCode: 403 };
            // }

            if (requester_id === item.user_id) {
                await transaction.rollback();
                throw { error: ERROR_MESSAGES.REQUEST_TO_SELF_FORBIDDEN, statusCode: 403 };
            }

            if (item.type === ItemType.FOUND) {
                const interest = await this.itemInterestsModel.findOne({
                    where: {
                        item_id: item_id,
                        user_id: requester_id
                    },
                    raw: true,
                    nest: true,
                    transaction
                });

                if (!interest) {
                    await transaction.rollback();
                    throw { error: ERROR_MESSAGES.INVALID_INTERACTION, statusCode: 403 };
                }
            } else if (item.type === ItemType.LOST) {
                const chat = await this.chatModel.findOne({
                    where: {
                        item_id: item_id,
                        [Op.or]: [
                            { sender_id: requester_id }, { receiver_id: requester_id },
                        ]
                    },
                    raw: true,
                    nest: true,
                    transaction
                });

                if (!chat) {
                    await transaction.rollback();
                    throw {
                        error: {
                            error: "NO_INTERACTION",
                            message: "For request view profile first need to interection via chat"
                        }, statusCode: 403
                    };
                }
            } else {
                await transaction.rollback();
                throw { error: ERROR_MESSAGES.INVALID_INTERACTION, statusCode: 400 };
            }

            const existingRequest = await this.permissionRequestsModel.findOne({
                where: {
                    item_id: item_id,
                    requester_id: requester_id,
                    [Op.or]: [{ status: ProfileViewStatus.PENDING }, { status: ProfileViewStatus.APPROVED }],
                },
                transaction,
            });

            if (existingRequest) {
                await transaction.rollback();
                throw { error: ERROR_MESSAGES.PERMISSION_ALREADY_REQUESTED, statusCode: 400 };
            }
            const request = await this.permissionRequestsModel.create(
                {
                    item_id: item_id,
                    owner_id: item.user_id,
                    requester_id: requester_id,
                    // item_interest_id: dto.item_interest_id,
                    // chat_id: dto.chat_id,
                    status: ProfileViewStatus.PENDING,
                },
                { transaction },
            );

            await transaction.commit();
            return request;
        } catch (err) {
            await transaction.rollback();
            throw {
                error: err?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: err?.statusCode || 500,
            };
        }
    }

    async getPermissionRequests(
        item_id: string,
        filters: PermissionRequestFilterDto,
        user: AuthUser,
    ): Promise<{ requests: ProfileViewRequests[]; page_context: PageContext }> {
        try {
            const { page = 1, limit = 10, status } = filters;
            const where: WhereOptions = {
                [Op.or]: [{ owner_id: user.id }, { requester_id: user.id }],
                ...(status && { status }),
                ...(item_id && { item_id }),
            };

            const { rows, count } = await this.permissionRequestsModel.findAndCountAll({
                where,
                include: [
                    { model: Item, as: 'item' },
                    // { model: User, as: 'owner', attributes: { exclude: ['password'] } },
                    { model: User, as: 'requester' },
                    // { model: ItemInterests, as: 'item_interest' },
                    // { model: Chat, as: 'chat' },
                ],
                offset: (page - 1) * limit,
                limit,
                raw: true,
                nest: true,
            });

            const page_context: PageContext = {
                page,
                limit,
                total: count,
                ...(status && { status }),
                ...(item_id && { item_id }),
            };
            return { requests: rows, page_context };
        } catch (err) {
            throw {
                error: err?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: err?.statusCode || 500,
            };
        }
    }

    async updatePermissionRequestStatus(
        id: string,
        user_id: string,
        newStatus: ProfileViewStatus,
    ): Promise<ProfileViewRequests> {
        const transaction = await this.sequelize.transaction();
        try {
            const request = await this.permissionRequestsModel.findByPk(id, { transaction });

            if (!request) {
                await transaction.rollback();
                throw { error: ERROR_MESSAGES.PERMISSION_REQUEST_NOT_FOUND, statusCode: 404 };
            }

            if (request.getDataValue('owner_id') !== user_id) {
                await transaction.rollback();
                throw { error: ERROR_MESSAGES.NOT_REQUEST_OWNER, statusCode: 403 };
            }

            const currentStatus = request.getDataValue('status');
            const validTransitions: { [key in ProfileViewStatus]?: ProfileViewStatus[] } =
            {
                [ProfileViewStatus.PENDING]: [ProfileViewStatus.APPROVED, ProfileViewStatus.DENIED],
                [ProfileViewStatus.APPROVED]: [ProfileViewStatus.DENIED],
            };

            if (!validTransitions[currentStatus]?.includes(newStatus)) {
                await transaction.rollback();
                throw { error: ERROR_MESSAGES.INVALID_PERMISSION_REQUEST_STATUS, statusCode: 400 };
            }

            await request.update({ status: newStatus }, { transaction });
            await transaction.commit();
            return request;
        } catch (err) {
            await transaction.rollback();
            throw { error: err?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: err?.statusCode || 500 };
        }
    }

    async getProfileViewers(
        item_id: string,
        filters: ApprovePermissionRequestFilterDto,
        user: AuthUser,
    ): Promise<{ viewers: ProfileViewRequests[]; page_context: PageContext }> {
        try {
            const { page = 1, limit = 10 } = filters;
            if (!isAdminRole(user.role_name) && user.id !== filters.owner_id)
                throw { error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 };

            const where: WhereOptions = {
                owner_id: filters.owner_id || user.id,
                status: ProfileViewStatus.APPROVED,
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

            return {
                viewers: rows,
                page_context: { page, limit, total: count, status: ProfileViewStatus.APPROVED, ...(item_id && { item_id }) },
            };
        } catch (err) {
            throw { error: err?.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: err?.statusCode || 500 };
        }
    }
}