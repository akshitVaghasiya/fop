import { Table, Column, Model, DataType, ForeignKey, BelongsTo, } from 'sequelize-typescript';
import { Item } from './item.model';
import { User } from 'src/common/models/users.model';

@Table({
  tableName: 'item_interests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ItemInterest extends Model {
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
  @Column({ type: DataType.UUID, allowNull: false, field: 'user_id' })
  user_id: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  user: User;
}
