import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { Item } from './item.model';
import { ItemInterest } from './item-interest.model';
import { ItemReceiver } from './item-receiver.model';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Table({
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class User extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({ type: DataType.STRING, primaryKey: true })
  name: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  password: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    allowNull: false,
    defaultValue: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  })
  is_active: boolean;

  @HasMany(() => Item, { sourceKey: 'id', foreignKey: 'user_id' })
  items: Item[];

  @HasMany(() => ItemInterest, { sourceKey: 'id', foreignKey: 'user_id' })
  interests: ItemInterest[];

  @HasMany(() => ItemReceiver, { sourceKey: 'id', foreignKey: 'receiver_user_id', as: 'receivers' })
  receivedItems: ItemReceiver[];

  @HasMany(() => ItemReceiver, { sourceKey: 'id', foreignKey: 'assigned_by', as: 'assignedItems' })
  assignedItems: ItemReceiver[];
}
