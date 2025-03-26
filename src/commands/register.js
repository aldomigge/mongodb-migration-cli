import path from 'node:path';
import fs from 'node:fs';
import mongoose from 'mongoose';

import { connectToMongoDB, disconnectFromMongoDB } from '../db.js';
import { loadConfig } from '../config.js';
import logger from '../log.js';

const {
  migrations: { directory, collection, ext },
} = loadConfig();

const registerCommand = async (options) => {
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

    if (
      await mongoose.connection.db
        .collection(collection)
        .findOne({ name: migrationName })
    ) {
      logger.info('[REGISTER]: Migração já registrada.');
      return;
    }

    const isSafeLock = options.safe || false;

    if (isSafeLock) {
      const existingSafeLock = await mongoose.connection.db
        .collection(collection)
        .findOne({ safeLock: true });

      if (existingSafeLock) {
        logger.info('[REGISTER]: Já existe uma migração com --safe. Use o comando safe-lock --file <filename> para alterar a migração segura.');
        return;
      }
    }

    logger.info(`[REGISTER]: Registrando a migração: ${migrationName}`);

    await mongoose.connection.db
      .collection(collection)
      .insertOne(
        {
          name: migrationName,
          safeLock: isSafeLock,
          executedAt: null,
          registeredAt: new Date(),
        }
      );

    logger.info(`[REGISTER]: Migração ${migrationName} registrada com sucesso!`);
  } catch (error) {
    logger.error('[REGISTER::ERROR]: Erro ao registrar a migração:', error.message);
    console.log(error);
  } finally {
    await disconnectFromMongoDB();
  }
};

export default registerCommand;
