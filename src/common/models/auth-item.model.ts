import { Table, Column, Model, DataType, DefaultScope } from 'sequelize-typescript';

@DefaultScope(() => ({
    attributes: { exclude: ['created_at', 'updated_at'] },
}))

@Table({
    tableName: 'auth_item',
})
export class AuthItem extends Model {
    @Column({
        primaryKey: true,
        type: DataType.STRING(50),
    })
    name: string;
}