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
    ) { }

    create(dto: CreateUserProfileDto, user: AuthUser): Promise<UserProfile> {
        return new Promise(async (resolve, reject) => {
            try {
                const existingProfile = await this.userProfileModel.findOne({
                    where: { user_id: user.id },
                });
                if (existingProfile) {
                    return reject({ error: 'User profile already exists', statusCode: 400 });
                }

                const profile = await this.userProfileModel.create({
                    ...dto,
                    user_id: user.id,
                });
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

    findOneById(id: string, user: AuthUser): Promise<UserProfile> {
        return new Promise(async (resolve, reject) => {
            try {
                const profile = await this.userProfileModel.findByPk(id, {
                    include: [{ model: User, as: 'user' }],
                });
                if (!profile) {
                    return reject({ error: ERROR_MESSAGES.USER_NOT_FOUND, statusCode: 404 });
                }

                if (user.role !== UserRole.ADMIN && profile.user_id !== user.id) {
                    return reject({ error: ERROR_MESSAGES.FORBIDDEN_ACCESS, statusCode: 403 });
                }

                resolve(profile);
            } catch (error) {
                reject({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR, statusCode: 500 });
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