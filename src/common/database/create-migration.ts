import { writeFileSync } from 'fs';
import { join } from 'path';

function generateMigrationFile(migrationName?: string) {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const fileName = migrationName ? `${timestamp}-${migrationName}.ts` : `${timestamp}.ts`;
  const filePath = join(__dirname, '../database/migrations', fileName);

  const boilerplate = `
import { QueryInterface } from 'sequelize';

async function up(queryInterface: QueryInterface): Promise<void> {
  // Add your migration logic here
}

async function down(queryInterface: QueryInterface): Promise<void> {
  // Add your rollback logic here
}

export default { up, down };
`;

  writeFileSync(filePath, boilerplate.trim());
}

const migrationName = process.argv[2];
generateMigrationFile(migrationName);