import { Column, Model, Table, ForeignKey, DataType, AllowNull, BelongsTo } from 'sequelize-typescript';
import { Item } from './item.model';
import { User } from './users.model';
import { ItemInterests } from './item-interest.model';
import { Chat } from './chat.model';
import { ProfileViewStatus } from '../types/enums/profile-view-request.enum';


@Table({
    tableName: 'profile_view_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class ProfileViewRequests extends Model {
    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
    declare id: string;

    @ForeignKey(() => Item)
    @Column({ type: DataType.UUID, allowNull: false })
    item_id: string;

    @ForeignKey(() => User)
    @Column({ type: DataType.UUID, allowNull: false })
    owner_id: string;

    @ForeignKey(() => User)
    @Column({ type: DataType.UUID, allowNull: false })
    requester_id: string;

    @ForeignKey(() => ItemInterests)
    @AllowNull
    @Column({ type: DataType.UUID })
    item_interest_id?: string;

    @ForeignKey(() => Chat)
    @AllowNull
    @Column({ type: DataType.UUID })
    chat_id?: string;

    @Column({ type: DataType.ENUM(...Object.values(ProfileViewStatus)), allowNull: false, defaultValue: 'PENDING' })
    status: string;

    @BelongsTo(() => Item, { foreignKey: 'item_id', as: 'item', onDelete: 'CASCADE' })
    item: Item;

    @BelongsTo(() => User, { foreignKey: 'owner_id', as: 'owner', onDelete: 'CASCADE' })
    owner: User;

    @BelongsTo(() => User, { foreignKey: 'requester_id', as: 'requester', onDelete: 'CASCADE' })
    requester: User;

    @BelongsTo(() => ItemInterests, { foreignKey: 'item_interest_id', as: 'item_interest', onDelete: 'CASCADE' })
    item_interest: ItemInterests;

    @BelongsTo(() => Chat, { foreignKey: 'chat_id', as: 'chat', onDelete: 'CASCADE' })
    chat: Chat;
}