
import path from 'node:path';
import fs from 'node:fs';
import mongoose from 'mongoose';

import { connectToMongoDB, disconnectFromMongoDB } from '../db.js';
import { loadConfig } from '../config.js';
import logger from '../log.js';

const {
  migrations: { directory, collection, ext },
} = loadConfig();

const unregisterCommand = async (options) => {
  if (!options.file) {
    logger.info('[UNREGISTER]: Nenhum arquivo de migração especificado.');
    return;
  }

  await connectToMongoDB({ logger_flag: false });

  try {
    const migrationFile = path.join(
      directory,
      options.file.endsWith(ext) ? options.file : `${options.file}${ext}`
    );

    if (!fs.existsSync(migrationFile)) {
      logger.info('[UNREGISTER]: Arquivo de migração não encontrado.');
      return;
    }

    const migrationName = path.basename(migrationFile, ext);

    const migrationRecord = await mongoose.connection.db
      .collection(collection)
      .findOne({ name: migrationName });

    if (!migrationRecord) {
      logger.info('[UNREGISTER]: Migração não registrada.');
      return;
    }

    logger.info(`[UNREGISTER]: Removendo o registro da migração: ${migrationName}`);

    await mongoose.connection.db
      .collection(collection)
      .deleteOne({ name: migrationName });

    logger.info(`[UNREGISTER]: Registro da migração ${migrationName} removido com sucesso!`);
  } catch (error) {
    logger.error('[UNREGISTER::ERROR]: Erro ao remover o registro da migração:', error.message);
    console.log(error);
  } finally {
    await disconnectFromMongoDB();
  }
};

export default unregisterCommand;