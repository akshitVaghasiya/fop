import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, DefaultScope } from 'sequelize-typescript';
import { User } from './users.model';
import { Chat } from './chat.model';
import { ItemInterests } from './item-interest.model';
import { ProfileViewRequests } from './profile-view-request.model';
import { ItemStatus, ItemType } from '../types/enums/items.enum';

@DefaultScope(() => ({
  attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] },
}))

@Table({
  tableName: 'items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at',
})
export class Item extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.ENUM(...Object.values(ItemType)),
    allowNull: false,
    defaultValue: ItemType.FOUND,
    field: 'type',
  })
  type: string;

  @Column({ type: DataType.STRING, allowNull: false, field: 'title' })
  title: string;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'description' })
  description: string;

  @Column({ type: DataType.GEOGRAPHY('POINT'), allowNull: true, field: 'location' })
  location: any;

  @Column({ type: DataType.STRING, allowNull: true, field: 'image_url' })
  image_url?: string;

  @Column({
    type: DataType.ENUM(...Object.values(ItemStatus)),
    allowNull: false,
    defaultValue: ItemStatus.ACTIVE,
    field: 'status',
  })
  status: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  user_id: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  user: User;

  @HasMany(() => ItemInterests, { foreignKey: 'item_id', as: 'interests', onDelete: 'CASCADE' })
  interests: ItemInterests[];

  @HasMany(() => Chat, { foreignKey: 'item_id', as: 'chats', onDelete: 'CASCADE' })
  chats: Chat[];

  @HasMany(() => ProfileViewRequests, { foreignKey: 'item_id', as: 'permissions', onDelete: 'CASCADE' })
  permissions: ProfileViewRequests[];
}