import { Table, Column, Model, DataType, ForeignKey, BelongsTo, Scopes, DefaultScope } from 'sequelize-typescript';
import { User } from './users.model';
import { UserGender } from '../types/enums/user-profile.enum';

export interface ProfilePictureMetadata {
    name?: string;
    mimeType?: string;
    encoding?: string;
}

@DefaultScope(() => ({
    attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] },
}))

@Table({
    tableName: 'user_profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
})
export class UserProfile extends Model {
    @Column({
        primaryKey: true,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    declare id: string;

    @ForeignKey(() => User)
    @Column({ type: DataType.UUID, allowNull: false, unique: true })
    user_id: string;

    @BelongsTo(() => User, { onDelete: 'CASCADE' })
    user: User;

    @Column({ type: DataType.STRING, allowNull: false })
    address: string;

    @Column({ type: DataType.STRING, allowNull: false })
    mobile_number: string;

    @Column({ type: DataType.TEXT, allowNull: false })
    bio: string;

    @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false })
    hobbies: string[];

    @Column({
        type: DataType.ENUM(...Object.values(UserGender)),
        allowNull: false,
    })
    gender: UserGender;

    @Column({ type: DataType.DATEONLY, allowNull: false })
    date_of_birth: string;

    @Column({
        type: DataType.BLOB(),
        allowNull: true,
        get: function () {
            const buffer = this.getDataValue('profile_picture');
            const metadata = this.getDataValue('profile_picture_metadata');

            if (buffer && metadata?.mimeType) {
                const base64String = buffer.toString('base64');

                return `data:${metadata.mimeType};base64,${base64String}`;
            }
            return null;
        }
    })
    profile_picture: Buffer;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
        defaultValue: null
    })
    profile_picture_metadata: ProfilePictureMetadata;
}
