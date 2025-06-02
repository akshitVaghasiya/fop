import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProfilePictureMetadata, UserProfile } from 'src/common/models/user-profile.model';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserProfileFilterDto } from './dto/user-profile-filter.dto';
import { AuthUser } from 'src/common/types/auth-user.type';
import { Op } from 'sequelize';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { User } from 'src/common/models/users.model';
import { Item } from 'src/common/models/item.model';
import { ProfileViewRequests } from 'src/common/models/profile-view-request.model';
import { UserRole } from 'src/common/types/enums/users.enum';
import { isAdminRole } from 'src/common/utils/role.util';

type PageContext = {
    page: number;
    limit: number;
    total: number;
    search?: string;
};

@Injectable()
export class UserProfileService {
    constructor(
        @InjectModel(UserProfile)
        private readonly userProfileModel: typeof UserProfile,
        @InjectModel(ProfileViewRequests)
        private readonly permissionRequestsModel: typeof ProfileViewRequests,
        @InjectModel(Item) private readonly itemsModel: typeof Item,
    ) { }

    create(dto: CreateUserProfileDto, user: AuthUser, file?: Express.Multer.File): Promise<UserProfile> {
        return new Promise(async (resolve, reject) => {
            try {
                const existingProfile = await this.userProfileModel.findOne({
                    where: { user_id: user.id },
                });

                if (existingProfile) {
                    return reject({ error: 'User profile already exists', statusCode: 400 });
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

                resolve(profileWithoutPicture);
            } catch (error) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }

    findAll(filters: UserProfileFilterDto): Promise<{ profiles: UserProfile[]; page_context: PageContext }> {
        return new Promise(async (resolve, reject) => {
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

                resolve({ profiles: rows, page_context });
            } catch (error) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }

    getProfile(id: string, user: AuthUser, item_id?: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const profile = await this.userProfileModel.findOne({
                    where: { user_id: id },
                    // attributes: {
                    //     exclude: ['profile_picture', 'profile_picture_metadata'],
                    // },
                    // include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }],
                    // raw: true,
                    // nest: true,
                });

                if (!profile) {
                    return reject({ error: ERROR_MESSAGES.PROFILE_NOT_FOUND, statusCode: 404 });
                }

                if (user && (user.id === id || isAdminRole(user.role_name))) {
                    return resolve(profile);
                }

                if (!item_id) {
                    return reject({ error: ERROR_MESSAGES.NO_PROFILE_PERMISSION, statusCode: 403 });
                }

                const item = await this.itemsModel.findByPk(item_id, {
                    attributes: ['id', 'status'],
                    raw: true,
                });

                if (!item) {
                    return reject({ error: ERROR_MESSAGES.ITEM_NOT_FOUND, statusCode: 404 });
                }
                if (item.status === 'COMPLETED' || item.status === 'REJECTED') {
                    return reject({ error: ERROR_MESSAGES.ITEM_NOT_ACTIVE, statusCode: 400 });
                }

                const permission = await this.permissionRequestsModel.findOne({
                    where: {
                        owner_id: id,
                        requester_id: user?.id,
                        item_id,
                        status: 'APPROVED',
                    },
                    attributes: ['id', 'status'],
                    raw: true,
                });
                if (!permission) {
                    return reject({ error: ERROR_MESSAGES.NO_PROFILE_PERMISSION, statusCode: 403 });
                }

                resolve(profile);
            } catch (error) {
                console.log('error->', error);
                reject({ error: error.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: error.statusCode || 500 });
            }
        });
    }

    update(id: string, dto: UpdateUserProfileDto, user: AuthUser, file?: Express.Multer.File): Promise<UserProfile> {
        return new Promise(async (resolve, reject) => {
            try {
                const profile = await this.userProfileModel.findByPk(id, { raw: true, nest: true });

                if (!profile) {
                    return reject({ error: ERROR_MESSAGES.PROFILE_NOT_FOUND, statusCode: 404 });
                }

                if (!isAdminRole(user.role_name) && profile.user_id !== user.id) {
                    return reject({ error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 });
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
                    return reject({ error: 'User profile not found', statusCode: 404 });
                }

                resolve(updatedProfiles[0]);
            } catch (error) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
            }
        });
    }
}