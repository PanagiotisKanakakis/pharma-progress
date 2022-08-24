
console.log('Reading DB configuration for seeding');
console.log('Host: ' + process.env.PHARMA_POSTGRES_HOST);
console.log('Post: ' + process.env.PHARMA_POSTGRES_PORT);
console.log('User: ' + process.env.PHARMA_POSTGRES_USER);
console.log('DB: ' + process.env.PHARMA_POSTGRES_DB);

export const DatabaseConfig = {
  type: 'postgres' as any,
  host: process.env.PHARMA_POSTGRES_HOST,
  port: process.env.PHARMA_POSTGRES_PORT,
  username: process.env.PHARMA_POSTGRES_USER,
  password: process.env.PHARMA_POSTGRES_PASSWORD,
  database: process.env.PHARMA_POSTGRES_DB,
  synchronize: false,
  migrationsRun: true,
  migrationsTableName: 'seeds',
  entities: ["src/**/**.entity{.js,.ts}"],
  migrations: ["src/database/seeds/**/**{.js,.ts}"],
  cli: { "migrationsDir": "src/database/seeds" },
}

export default DatabaseConfig;
