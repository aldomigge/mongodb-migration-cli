import path from 'node:path';
import mongoose from 'mongoose';

import { connectToMongoDB, disconnectFromMongoDB } from '../db.js';
import { loadConfig } from '../config.js';
import logger from '../log.js';

const {
  migrations: { directory, collection, ext },
} = loadConfig();

const downCommand = async (options) => {
  await connectToMongoDB({ logger_flag: false });

  try {
    if (options.all) {
      const allMigrations = await mongoose.connection.db
        .collection(collection)
        .find()
        .sort({ _id: -1 })
        .toArray();

      if (allMigrations.length === 0) {
        logger.info('[DOWN]: NENHUMA MIGRAÇÃO ENCONTRADA');
        return;
      }

      for (const migration of allMigrations) {
        const migrationName = migration.name;
        const migrationModule = await import(
          path.resolve(`${directory}/${migrationName}${ext}`)
        ).then((mod) => mod.default || mod);

        if (typeof migrationModule.down === 'function') {
          logger.info(`[DOWN]: DESFAZENDO MIGRAÇÃO: ${migrationName}`);
          await migrationModule.down();
          logger.info(
            `[DOWN]: MIGRAÇÃO ${migrationName} DESFEITA COM SUCESSO!`,
          );

          await mongoose.connection.db
            .collection(collection)
            .deleteOne({ name: migrationName });
        }
      }
    } else {
      let migrationName;

      if (options.file) {
        migrationName = options.file.endsWith(ext)
          ? options.file.slice(0, -ext.length)
          : options.file;
      } else {
        const lastMigration = await mongoose.connection.db
          .collection(collection)
          .find()
          .sort({ _id: -1 })
          .limit(1)
          .toArray();

        if (lastMigration.length === 0) {
          logger.info('[DOWN]: NENHUMA MIGRAÇÃO ENCONTRADA');
          return;
        }

        migrationName = lastMigration[0].name;
      }

      const migrationModule = await import(
        path.resolve(`${directory}/${migrationName}${ext}`)
      ).then((mod) => mod.default || mod);

      if (typeof migrationModule.down === 'function') {
        logger.info(`[DOWN]: DESFAZENDO MIGRAÇÃO: ${migrationName}`);
        await migrationModule.down();
        logger.info(`[DOWN]: MIGRAÇÃO ${migrationName} DESFEITA COM SUCESSO!`);

        await mongoose.connection.db
          .collection(collection)
          .deleteOne({ name: migrationName });
      }
    }
  } catch (error) {
    console.log(error);
    logger.error('[DOWN::ERROR]: Erro ao desfazer a migração:', error.message);
  } finally {
    await disconnectFromMongoDB();
  }
};

export default downCommand;
