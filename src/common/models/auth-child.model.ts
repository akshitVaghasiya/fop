import { Table, Column, Model, DataType, ForeignKey, DefaultScope } from 'sequelize-typescript';
import { AuthItem } from './auth-item.model';

@DefaultScope(() => ({
    attributes: { exclude: ['created_at', 'updated_at'] },
}))

@Table({
    tableName: 'auth_child',
})
export class AuthChild extends Model {
    @Column({
        type: DataType.STRING(50),
        allowNull: false,
        primaryKey: true,
    })
    @ForeignKey(() => AuthItem)
    parent: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
        primaryKey: true,
    })
    @ForeignKey(() => AuthItem)
    child: string;
}