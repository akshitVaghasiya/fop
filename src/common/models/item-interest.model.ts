// src/common/models/item-interests.model.ts
import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Item } from './item.model';
import { User } from './users.model';
import { Chat } from './chat.model';

@Table({
  tableName: 'item_interests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ItemInterests extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => Item)
  @Column({ type: DataType.UUID, allowNull: false, field: 'item_id' })
  item_id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, field: 'user_id' })
  user_id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true, field: 'assigned_by' })
  assigned_by: string | null;

  @BelongsTo(() => Item, { onDelete: 'CASCADE' })
  item: Item;

  @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' })
  user: User;

  @BelongsTo(() => User, { foreignKey: 'assigned_by', as: 'assigner', onDelete: 'SET NULL' })
  assigner: User;

  @HasMany(() => Chat, { foreignKey: 'claim_id', onDelete: 'CASCADE' })
  chats: Chat[];
}