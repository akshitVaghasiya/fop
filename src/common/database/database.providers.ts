// import { Sequelize } from 'sequelize-typescript';
// import { User } from '../models/users.model';
// import { Item } from '../models/item.model';
// import { ItemReceiver } from '../models/item-receiver.model';
// import { ItemInterest } from '../models/item-interest.model';

// export const databaseProviders = [
//     {
//         provide: 'SEQUELIZE',
//         useFactory: async () => {
//             try {
//                 const sequelize = new Sequelize({
//                     dialect: 'postgres',
//                     host: process.env.DB_HOST || 'localhost',
//                     port: Number(process.env.DB_PORT) || 5432,
//                     username: process.env.DB_USERNAME || 'postgres',
//                     password: process.env.DB_PASSWORD || 'admin',
//                     database: process.env.DB_NAME || 'find_out_portal',
//                 });

//                 sequelize.addModels([User, Item, ItemReceiver, ItemInterest]);
//                 await sequelize.sync(); // Uncomment if automatic sync is desired
//                 console.log('Database connection established successfully.');
//                 return sequelize;
//             } catch (error) {
//                 console.error('Unable to connect to the database:', error);
//                 throw error;
//             }
//         },
//     },
// ];
