import { Column, Model, Table, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './users.model';

@Table({
    tableName: 'user_preferences',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
})
export class UserPreference extends Model {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare id: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    user_id: string;

    @Column({
        type: DataType.ARRAY(DataType.TEXT),
        allowNull: false,
        defaultValue: [],
    })
    preferred_categories: string[];

    @Column({
        type: DataType.JSONB,
        allowNull: false,
    })
    search_filters: object;

    @Column({
        type: DataType.JSON,
        allowNull: true,
    })
    metadata: object;

    @Column({
        type: DataType.DECIMAL(7, 2),
        allowNull: true,
    })
    max_budget: number;

    @Column({
        type: DataType.VIRTUAL(DataType.STRING),
        get(this: UserPreference) {
            const userId = this.getDataValue('user_id');
            return `this is virtual ${userId}`;
        },
    })
    item_list: string;

    @BelongsTo(() => User)
    user: User;
}