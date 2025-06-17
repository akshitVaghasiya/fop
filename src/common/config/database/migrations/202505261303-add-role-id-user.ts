import { DataTypes, QueryInterface } from 'sequelize';

async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (transaction) => {
    // Add role_id column
    await queryInterface.addColumn(
      'users',
      'role_id',
      {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'roles', key: 'id' },
        onDelete: 'SET NULL',
      },
      { transaction },
    );
  });
}

async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.transaction(async (transaction) => {
    // Remove foreign key constraint (if named by Sequelize convention)
    await queryInterface.removeConstraint('users', 'users_role_id_fkey', { transaction }).catch(() => { });

    // Remove role_id column
    await queryInterface.removeColumn('users', 'role_id', { transaction });
  });
}

export default { up, down };