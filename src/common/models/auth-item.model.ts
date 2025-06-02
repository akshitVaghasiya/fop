import { Table, Column, Model, DataType, DefaultScope } from 'sequelize-typescript';

@Table({
    tableName: 'auth_item',
    timestamps: false,
})
export class AuthItem extends Model {
    @Column({
        primaryKey: true,
        type: DataType.STRING(50),
    })
    name: string;
}