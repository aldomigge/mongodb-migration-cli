import mongoose from 'mongoose';

import { connectToMongoDB, disconnectFromMongoDB } from '../db.js';
import { loadConfig } from '../config.js';
import logger from '../log.js';

const {
  migrations: { collection },
} = loadConfig();

const allMigrationsCommand = async () => {
  await connectToMongoDB({ logger_flag: true });

  const migrations = await mongoose.connection.db
    .collection(collection)
    .find()
    .toArray();

  if (migrations.length === 0) {
    logger.info('[ALL-MIGRATIONS]: NENHUMA MIGRAÇÃO ENCONTRADA');

    await disconnectFromMongoDB({ logger_flag: true });
    return;
  }

  logger.info('[ALL-MIGRATIONS]: MIGRAÇÕES ENCONTRADAS:');
  migrations
    .map((migration) => ({
      name: migration.name,
      executedAt: new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'short',
        timeStyle: 'medium',
        timeZone: 'UTC',
      }).format(new Date(migration.executedAt)),
    }))
    .forEach((migration) => logger.info(JSON.stringify(migration, null, 2)));

  await disconnectFromMongoDB({ logger_flag: true });
};

export default allMigrationsCommand;
