import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('auth_item', {
    name: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false,
    },
  });

  await queryInterface.createTable('roles', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    auth_items: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Create auth_child table
  await queryInterface.createTable('auth_child', {
    parent: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
      references: { model: 'auth_item', key: 'name' },
      onDelete: 'CASCADE',
    },
    child: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
      references: { model: 'auth_item', key: 'name' },
      onDelete: 'CASCADE',
    }
  });

}

async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('auth_child');

  // Drop roles table
  await queryInterface.dropTable('roles');

  // Drop auth_item table
  await queryInterface.dropTable('auth_item');
}

export default { up, down };