import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateItemsReceiversTable1746170129575
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'item_receivers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'item_id',
            type: 'uuid',
          },
          {
            name: 'receiver_user_id',
            type: 'uuid',
          },
          {
            name: 'assigned_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'assigned_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Foreign key: item_id → items(id)
    await queryRunner.createForeignKey(
      'item_receivers',
      new TableForeignKey({
        columnNames: ['item_id'],
        referencedTableName: 'items',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key: receiver_user_id → users(id)
    await queryRunner.createForeignKey(
      'item_receivers',
      new TableForeignKey({
        columnNames: ['receiver_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key: assigned_by → users(id), nullable
    await queryRunner.createForeignKey(
      'item_receivers',
      new TableForeignKey({
        columnNames: ['assigned_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('item_receivers');
    if (table) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey('item_receivers', fk);
      }
    }
    await queryRunner.dropTable('item_receivers');
  }
}
