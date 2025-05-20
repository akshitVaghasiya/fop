import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, HasOne, } from 'sequelize-typescript';
import { ItemInterest } from './item-interest.model';
import { ItemReceiver } from './item-receiver.model';
import { User } from './users.model';
import { ItemStatus, ItemType } from '../types/enums/items.enum';

@Table({
  tableName: 'items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
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
    defaultValue: ItemType.LOST,
    field: 'type',
  })
  type: ItemType;

  @Column({ type: DataType.STRING, allowNull: false, field: 'title' })
  title: string;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'description' })
  description: string;

  @Column({ type: DataType.STRING, allowNull: false, field: 'location' })
  location: string;

  @Column({ type: DataType.STRING, allowNull: true, field: 'image_url' })
  image_url?: string;

  @Column({
    type: DataType.ENUM(...Object.values(ItemStatus)),
    allowNull: false,
    defaultValue: ItemStatus.ACTIVE,
    field: 'status',
  })
  status: ItemStatus;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, primaryKey: true })
  user_id: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  user: User;

  @HasMany(() => ItemInterest, { foreignKey: 'item_id' })
  interests: ItemInterest[];

  @HasOne(() => ItemReceiver, { foreignKey: 'item_id', as: 'receiver' })
  receiver: ItemReceiver;
}
