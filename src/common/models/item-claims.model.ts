import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './users.model';
import { Item } from './item.model';

@Table({
    tableName: 'item_claims',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class ItemClaim extends Model { // Changed from Model<ItemClaim>
    @Column({
        primaryKey: true,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    declare id: string;

    @ForeignKey(() => Item)
    @Column({ type: DataType.UUID, allowNull: false })
    item_id: string;

    @BelongsTo(() => Item, { onDelete: 'CASCADE' })
    item: Item;

    @ForeignKey(() => User)
    @Column({ type: DataType.UUID, allowNull: false, field: 'user_id' })
    user_id: string;

    @BelongsTo(() => User, { onDelete: 'CASCADE' })
    user: User;
}