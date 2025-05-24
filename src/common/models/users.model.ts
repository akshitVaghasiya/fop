// src/common/models/users.model.ts
import { Table, Column, Model, DataType, HasMany, HasOne } from 'sequelize-typescript';
import { UserProfile } from './user-profile.model';
import { Item } from './item.model';
import { Chat } from './chat.model';
import { ItemInterests } from './item-interest.model';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
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

  @Column({ type: DataType.STRING, allowNull: false })
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

  @HasOne(() => UserProfile, { foreignKey: 'user_id', onDelete: 'CASCADE' })
  profile: UserProfile;

  @HasMany(() => Item, { foreignKey: 'user_id', onDelete: 'CASCADE' })
  items: Item[];

  @HasMany(() => ItemInterests, { foreignKey: 'user_id', as: 'interests', onDelete: 'CASCADE' })
  interests: ItemInterests[];

  @HasMany(() => ItemInterests, { foreignKey: 'assigned_by', as: 'assignments', onDelete: 'SET NULL' })
  assignments: ItemInterests[];

  @HasMany(() => Chat, { foreignKey: 'sender_id', as: 'sentMessages', onDelete: 'CASCADE' })
  sentMessages: Chat[];

  @HasMany(() => Chat, { foreignKey: 'receiver_id', as: 'receivedMessages', onDelete: 'CASCADE' })
  receivedMessages: Chat[];
}