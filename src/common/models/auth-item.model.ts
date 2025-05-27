import { Table, Column, Model, DataType } from 'sequelize-typescript';

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