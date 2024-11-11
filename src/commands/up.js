import path from 'node:path';
import fs from 'node:fs';
import mongoose from 'mongoose';

import { connectToMongoDB, disconnectFromMongoDB } from '../db.js';
import { loadConfig } from '../config.js';
import logger from '../log.js';

const {
  migrations: { directory, collection, ext },
} = loadConfig();

const upCommand = async (options) => {
  if (options.safe && !options.file) {
    logger.error(
      '[UP::ERROR]: A flag --safe só é válida para uma migração específica',
    );
    return;
  };

  await connectToMongoDB({ logger_flag: false });

  try {
    const migrationsFiles = options.file
      ? [
        path.join(
          directory,
          options.file.endsWith(ext) ? options.file : `${options.file}${ext}`,
        ),
      ]
      : fs
        .readdirSync(directory)
        .filter((file) => file.endsWith(ext))
        .map((file) => path.join(directory, file));

    if (migrationsFiles.length === 0) {
      logger.info('[UP]: NENHUMA MIGRAÇÃO ENCONTRADA');
      return;
    }

    for (const file of migrationsFiles) {
      const migration = await import(path.resolve(file));
      const migrationModule = migration.default || migration;

      if (typeof migrationModule.up === 'function') {
        const migrationName = path.basename(file, ext);

        if (
          await mongoose.connection.db
            .collection(collection)
            .findOne({ name: migrationName })
        )
          continue;

        logger.info(`[UP]: EXECUTANDO A MIGRAÇÃO: ${migrationName}`);

        await migrationModule.up();

        const isSafeLock = options.safe && options.file ? true : false;

        await mongoose.connection.db
          .collection(collection)
          .insertOne({
            name: migrationName,
            safeLock: isSafeLock,
            registeredAt: new Date(),
            executedAt: new Date()
          });

        if (!isSafeLock) {
          logger.info(`[UP]: MIGRAÇÃO ${migrationName} EXECUTADA COM SUCESSO!`);
        } else {
          logger.info(`[UP]: MIGRAÇÃO ${migrationName} EXECUTADA COM SUCESSO! (Segura)`);
        }
      }
    }
  } catch (error) {
    logger.error('[UP::ERROR]: Erro ao executar a migração:', error.message);
    console.log(error);
  } finally {
    await disconnectFromMongoDB();
  }
};

export default upCommand;
