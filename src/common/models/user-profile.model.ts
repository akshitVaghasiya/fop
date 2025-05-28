import { Table, Column, Model, DataType, ForeignKey, BelongsTo, Scopes } from 'sequelize-typescript';
import { User, Gender } from './users.model';

export interface ProfilePictureMetadata {
    name?: string;
    mimeType?: string;
    encoding?: string;
}

// @Scopes(() => (
//     getProfilePicture() {
//         const buffer = this.getDataValue('profile_picture');
//         const metadata = this.getDataValue('profile_picture_metadata');

//         // Add null checks
//         if(buffer && metadata && metadata.mimeType) {
//     const base64String = buffer.toString('base64');
//     return `data:${metadata.mimeType};base64,${base64String}`;
// }
// return null;
//     }
// ));
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
        type: DataType.ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'),
        allowNull: false,
    })
    gender: Gender;

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
