import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Item } from './item.model';
import { User } from './users.model';
import { ItemInterests } from './item-interest.model';
import { ProfileViewRequests } from './profile-view-permission.model';

@Table({
    tableName: 'chats',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
})
export class Chat extends Model {
    @Column({
        primaryKey: true,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    declare id: string;

    @ForeignKey(() => Item)
    @Column({ type: DataType.UUID, allowNull: false, field: 'item_id' })
    item_id: string;

    @ForeignKey(() => ItemInterests)
    @Column({ type: DataType.UUID, allowNull: true, field: 'claim_id' })
    claim_id: string | null;

    @ForeignKey(() => User)
    @Column({ type: DataType.UUID, allowNull: false, field: 'sender_id' })
    sender_id: string;

    @ForeignKey(() => User)
    @Column({ type: DataType.UUID, allowNull: false, field: 'receiver_id' })
    receiver_id: string;

    @Column({ type: DataType.TEXT, allowNull: false, field: 'message' })
    message: string;

    @BelongsTo(() => Item, { onDelete: 'CASCADE' })
    item: Item;

    @BelongsTo(() => ItemInterests, { foreignKey: 'claim_id', onDelete: 'CASCADE' })
    claim: ItemInterests;

    @BelongsTo(() => User, { foreignKey: 'sender_id', as: 'sender', onDelete: 'CASCADE' })
    sender: User;

    @BelongsTo(() => User, { foreignKey: 'receiver_id', as: 'receiver', onDelete: 'CASCADE' })
    receiver: User;

    @HasMany(() => ProfileViewRequests, { foreignKey: 'chat_id', as: 'permissions', onDelete: 'CASCADE' })
    permissions: ProfileViewRequests[];
}