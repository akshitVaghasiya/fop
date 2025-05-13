import fs from 'fs';
import path from 'path';

const migrationName = process.argv[2];
if (!migrationName) {
    console.error('Please provide a migration name.');
    process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
const fileName = `${timestamp}-${migrationName}.ts`;

// Replace __dirname with process.cwd()
const filePath = path.join(process.cwd(), 'src/migrations', fileName);

const template = `
import { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Write your migration logic here
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Write your rollback logic here
}
`;

fs.writeFileSync(filePath, template);
console.log(`Migration created: ${filePath}`);