import { Table, Column, Model, DataType, ForeignKey, BelongsTo, } from 'sequelize-typescript';
import { User } from './users.model';
import { Item } from './item.model';

@Table({
  tableName: 'item_receivers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ItemReceiver extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => Item)
  @Column({ type: DataType.UUID, allowNull: false, field: 'item_id' })
  item_id: string;

  @BelongsTo(() => Item, { onDelete: 'CASCADE' })
  item: Item;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, field: 'receiver_user_id' })
  receiver_user_id: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE', foreignKey: 'receiver_user_id', as: 'receiver' })
  receiver: User;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true, field: 'assigned_by' })
  assigned_by?: string;

  @BelongsTo(() => User, { foreignKey: 'assigned_by', as: 'assigner' })
  assigner: User;
}
