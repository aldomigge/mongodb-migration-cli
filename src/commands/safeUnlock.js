
import path from 'node:path';
import fs from 'node:fs';
import mongoose from 'mongoose';

import { connectToMongoDB, disconnectFromMongoDB } from '../db.js';
import { loadConfig } from '../config.js';
import logger from '../log.js';

const {
  migrations: { directory, collection, ext },
} = loadConfig();

const safeUnlockCommand = async (options) => {
  if (!options.file) {
    logger.info('[UNLOCK]: Nenhum arquivo de migração especificado.');
    return;
  }

  await connectToMongoDB({ logger_flag: false });

  try {
    const migrationFile = path.join(
      directory,
      options.file.endsWith(ext) ? options.file : `${options.file}${ext}`
    );

    if (!fs.existsSync(migrationFile)) {
      logger.info('[UNLOCK]: Arquivo de migração não encontrado.');
      return;
    }

    const migrationName = path.basename(migrationFile, ext);

    const migration = await mongoose.connection.db
      .collection(collection)
      .findOne({ name: migrationName });

    if (!migration) {
      logger.info('[UNLOCK]: Migração não registrada.');
      return;
    }

    if (!migration.safeLock) {
      logger.info('[UNLOCK]: Migração já está com safeLock igual a false.');
      return;
    }

    await mongoose.connection.db
      .collection(collection)
      .updateOne(
        { _id: migration._id },
        { $set: { safeLock: false } }
      );

    logger.info(`[UNLOCK]: Migração ${migrationName} alterada para não segura com sucesso!`);
  } catch (error) {
    logger.error('[UNLOCK::ERROR]: Erro ao alterar a migração:', error.message);
    console.log(error);
  } finally {
    await disconnectFromMongoDB();
  }
};

export default safeUnlockCommand;