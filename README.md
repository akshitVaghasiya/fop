## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev
```

## Compile and run the project

```bash
# create migration (e.g., npm run migration:create create-items-receiver-table)
$ npm run migration:create <name>

# apply migrations
$ npm run migration:up

# revert last migration
$ npm run migration:down

# list migrations and their status (applied or not)
$ npm run migration:list
```