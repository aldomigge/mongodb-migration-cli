import path from 'node:path';
import fs from 'node:fs';
import mongoose from 'mongoose';

import { connectToMongoDB, disconnectFromMongoDB } from '../db.js';
import { loadConfig } from '../config.js';
import logger from '../log.js';

const {
  migrations: { directory, collection, ext },
} = loadConfig();

const safeLockCommand = async (options) => {
  if (!options.file) {
    logger.info('[REGISTER]: Nenhum arquivo de migração especificado.');
    return;
  }

  await connectToMongoDB({ logger_flag: false });

  try {
    const migrationFile = path.join(
      directory,
      options.file.endsWith(ext) ? options.file : `${options.file}${ext}`
    );

    if (!fs.existsSync(migrationFile)) {
      logger.info('[REGISTER]: Arquivo de migração não encontrado.');
      return;
    }

    const migrationName = path.basename(migrationFile, ext);

    const existingMigration = await mongoose.connection.db
      .collection(collection)
      .findOne({ name: migrationName });

    if (existingMigration && existingMigration.safeLock) {
      logger.info(`[REGISTER]: Migração ${migrationName} já está marcada como segura.`);
      return;
    }

    const isSafeLock = true;

    const existingSafeLock = await mongoose.connection.db
      .collection(collection)
      .findOne({ safeLock: true });

    if (existingSafeLock) {
      await mongoose.connection.db
        .collection(collection)
        .updateOne(
          { _id: existingSafeLock._id },
          { $set: { safeLock: false } }
        );
      logger.info(`[REGISTER]: Migração ${existingSafeLock.name} alterada para não segura.`);
    }

    logger.info(`[REGISTER]: Registrando a migração: ${migrationName} como segura.`);

    await mongoose.connection.db
      .collection(collection)
      .updateOne(
        { name: migrationName },
        {
          $set: {
            safeLock: isSafeLock,
            registeredAt: new Date(),
          }
        },
        { upsert: true }
      );

    logger.info(`[REGISTER]: Migração ${migrationName} registrada com sucesso!`);
  } catch (error) {
    logger.error('[REGISTER::ERROR]: Erro ao registrar a migração:', error.message);
    console.log(error);
  } finally {
    await disconnectFromMongoDB();
  }
};

export default safeLockCommand;
