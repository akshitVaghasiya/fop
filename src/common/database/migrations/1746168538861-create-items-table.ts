import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateItemsTable1746168538861 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First create enums for ItemType and ItemStatus
    await queryRunner.query(`
            CREATE TYPE "items_type_enum" AS ENUM ('LOST', 'FOUND', 'FREE')
        `);

    await queryRunner.query(`
            CREATE TYPE "items_status_enum" AS ENUM ('ACTIVE', 'CLAIMED', 'RESOLVED')
        `);

    // Then create the table
    await queryRunner.createTable(
      new Table({
        name: 'items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'type',
            type: 'items_type_enum',
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'location',
            type: 'varchar',
          },
          {
            name: 'image_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'items_status_enum',
            default: `'ACTIVE'`,
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Add foreign key to users table
    await queryRunner.createForeignKey(
      'items',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the foreign key and table first
    const table = await queryRunner.getTable('items');
    const foreignKey = table?.foreignKeys.find((fk) =>
      fk.columnNames.includes('user_id'),
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('items', foreignKey);
    }

    await queryRunner.dropTable('items');

    // Drop enums
    await queryRunner.query(`DROP TYPE "items_type_enum"`);
    await queryRunner.query(`DROP TYPE "items_status_enum"`);
  }
}
