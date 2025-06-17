import { QueryInterface, DataTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('items', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.literal('gen_random_uuid()'),
    },
    type: {
      type: DataTypes.ENUM('LOST', 'FOUND', 'FREE'),
      allowNull: false,
      defaultValue: 'LOST',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'CLAIMED', 'RESOLVED'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });
}

async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('items', {});
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_items_type";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_items_status";');
}

export default { up, down };