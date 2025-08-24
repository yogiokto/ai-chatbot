import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({
  path: '.env.local',
});

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  try {
    console.log('⏳ Running migrations (public schema)...');

    const start = Date.now();
    await migrate(db, { migrationsFolder: './lib/db/migrations' });
    const end = Date.now();

    console.log('✅ Migrations completed in', end - start, 'ms');

    // close connection cleanly
    await (connection as any).end();
    process.exit(0);
  } catch (err) {
    // attempt to close connection before rethrowing so top-level handler can log and exit
    try {
      await (connection as any).end();
    } catch (_) {
      // ignore
    }
    throw err;
  }
};

runMigrate().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
});
