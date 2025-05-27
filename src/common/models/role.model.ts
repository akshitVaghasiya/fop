import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { User } from './users.model';

@Table({
    tableName: 'roles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
})
export class Role extends Model {
    @Column({
        primaryKey: true,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    declare id: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
        unique: true,
    })
    name: string;

    @Column({
        type: DataType.ARRAY(DataType.STRING),
        allowNull: false,
        defaultValue: [],
    })
    auth_items: string[];

    @HasMany(() => User, { foreignKey: 'role_id', onDelete: 'SET NULL' })
    users: User[];
}