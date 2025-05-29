import { Table, Column, Model, DataType, HasMany, HasOne, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { UserProfile } from './user-profile.model';
import { Item } from './item.model';
import { Chat } from './chat.model';
import { ItemInterests } from './item-interest.model';
import { ProfileViewRequests } from './profile-view-request.model';
import { Role } from './role.model';
import { UserRole } from '../types/enums/users.enum';

@Table({
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at',
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

  @ForeignKey(() => Role)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  role_id: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  })
  is_active: boolean;

  @BelongsTo(() => Role, { foreignKey: 'role_id' })
  auth_items: Role;

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

  @HasMany(() => ProfileViewRequests, { foreignKey: 'owner_id', as: 'ownedPermissions', onDelete: 'CASCADE' })
  ownedPermissions: ProfileViewRequests[];

  @HasMany(() => ProfileViewRequests, { foreignKey: 'requester_id', as: 'requestedPermissions', onDelete: 'CASCADE' })
  requestedPermissions: ProfileViewRequests[];
}