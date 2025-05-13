import { Sequelize } from 'sequelize-typescript';
import { SequelizeStorage, Umzug } from 'umzug';
import { sequelizeConfig } from './database.config';

// Initialize Sequelize using the existing configuration
const sequelize = new Sequelize({
    ...sequelizeConfig,
    models: sequelizeConfig.models, // Ensure models are loaded
});

// Configure Umzug
export const umzug = new Umzug({
    migrations: {
        glob: 'src/migrations/*.ts', // Path to migration files
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
});