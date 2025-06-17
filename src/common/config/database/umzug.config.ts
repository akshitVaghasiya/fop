import { Sequelize } from 'sequelize-typescript';
import { SequelizeStorage, Umzug } from 'umzug';
import { sequelizeConfig } from './database.config';
import { join } from 'path';

const sequelize = new Sequelize({
    ...sequelizeConfig,
    models: sequelizeConfig.models,
});

export const umzug = new Umzug({
    migrations: {
        glob: ['*.ts', { cwd: join(__dirname, './migrations') }],
        resolve: ({ name, path, context }) => {
          const migration = require(path!).default;
          return {
            name,
            up: async () => migration.up(context, Sequelize),
            down: async () => migration.down(context, Sequelize),
          };
        },
      },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
});

async function migrate() {
    try {

        await umzug.up();
        console.log('Migrations completed successfully!');
    } catch (err) {
        console.error('Migration error:', err);
    }
}

async function revert() {
    try {
        await umzug.down();
        console.log('Last migration reverted successfully!');
    } catch (err) {
        console.error('Revert error:', err);
    }
}

async function list() {
    try {
        const executed = await umzug.executed();
        const pending = await umzug.pending();
        console.log('Executed Migrations:', executed.map((m) => m.name));
        console.log('Pending Migrations:', pending.map((m) => m.name));
    } catch (err) {
        console.error('Listing error:', err);
    }
}

const command = process.argv[2];

switch (command) {
    case 'up':
        migrate();
        break;
    case 'down':
        revert();
        break;
    case 'list':
        list();
        break;
    default:
        console.log('Invalid command. Use "up", "down", or "list".');
        break;
}
