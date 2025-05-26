import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserProfile } from 'src/common/models/user-profile.model';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserProfileFilterDto } from './dto/user-profile-filter.dto';
import { AuthUser } from 'src/common/types/auth-user.type';
import { UserRole } from 'src/common/models/users.model';
import { Op } from 'sequelize';
import { ERROR_MESSAGES } from 'src/common/constants/error-response.constant';
import { User } from 'src/common/models/users.model';
import { Item } from 'src/common/models/item.model';
import { ProfileViewPermissionRequests } from 'src/common/models/profile-view-permission.model';

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
        @InjectModel(ProfileViewPermissionRequests)
        private readonly permissionRequestsModel: typeof ProfileViewPermissionRequests,
        @InjectModel(Item) private readonly itemsModel: typeof Item,
    ) { }

    create(dto: CreateUserProfileDto, user: AuthUser): Promise<UserProfile> {
        return new Promise(async (resolve, reject) => {
            try {
                const existingProfile = await this.userProfileModel.findOne({
                    where: { user_id: user.id },
                });
                console.log("existing-->", existingProfile);
                console.log("dto-->", dto);
                console.log("user-->", user);

                if (existingProfile) {
                    return reject({ error: 'User profile already exists', statusCode: 400 });
                }
                const data = {
                    ...dto,
                    user_id: user.id,
                }
                console.log("data-->", data);

                const profile = await this.userProfileModel.create(data);
                console.log("profile-->", profile);

                resolve(profile);
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

    getProfile(id: string, user: AuthUser, item_id?: string): Promise<UserProfile> {
        return new Promise(async (resolve, reject) => {
            try {
                const profile = await this.userProfileModel.findOne({
                    where: { user_id: id },
                    include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }],
                    raw: true,
                    nest: true,
                });
                console.log('profile-->', profile);
                console.log('user-->', user);

                if (!profile) {
                    return reject({ error: ERROR_MESSAGES.PROFILE_NOT_FOUND, statusCode: 404 });
                }

                if (user && (user.id === id || user.role === UserRole.ADMIN)) {
                    return resolve(profile);
                }

                if (!item_id) {
                    return reject({ error: ERROR_MESSAGES.NO_PROFILE_PERMISSION, statusCode: 403 });
                }

                const item = await this.itemsModel.findByPk(item_id, {
                    attributes: ['id', 'status'],
                    raw: true,
                });
                console.log('item-->', item);
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
                console.log('permission-->', permission);
                if (!permission) {
                    return reject({ error: ERROR_MESSAGES.NO_PROFILE_PERMISSION, statusCode: 403 });
                }

                resolve(profile);
            } catch (error) {
                reject({ error: error.error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: error.statusCode || 500 });
            }
        });
    }

    update(id: string, dto: UpdateUserProfileDto, user: AuthUser): Promise<UserProfile> {
        return new Promise(async (resolve, reject) => {
            try {
                const profile = await this.userProfileModel.findByPk(id);
                if (!profile) {
                    return reject({ error: 'User profile not found', statusCode: 404 });
                }

                if (user.role !== UserRole.ADMIN && profile.user_id !== user.id) {
                    return reject({ error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 });
                }

                const [rowsUpdated, updatedProfiles] = await this.userProfileModel.update(dto, {
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