import mongoose from 'mongoose';

import logger from './log.js';
import { loadConfig } from './config.js';

let mongoConnection = null;

mongoose.set('strict', true);

export async function connectToMongoDB({ logger_flag = false } = {}) {
  if (mongoConnection) return mongoConnection;

  try {
    const config = loadConfig();
    const { uri, user, password, database, options } = config.mongodb;

    const connectionString =
      user && password
        ? `${uri}/${database}?authSource=admin`
        : `${uri}/${database}`;

    await mongoose.connect(connectionString, {
      user,
      pass: password,
      ...options,
    });

    mongoConnection = mongoose.connection;

    if (logger_flag) {
      logger.info('[BANCO DE DADOS]: CONEXÃO COM MONGODB ESTABELECIDA');
    }

    return mongoConnection;
  } catch (error) {
    logger.error(
      '[BANCO DE DADOS]: ERRO AO CONECTAR AO MONGODB:',
      error.message,
    );
    process.exit(1);
  }
}

export async function disconnectFromMongoDB({ logger_flag = false } = {}) {
  if (!mongoConnection) return;

  try {
    await mongoose.disconnect();
    mongoConnection = null;

    if (logger_flag) {
      logger.info('[BANCO DE DADOS]: CONEXÃO COM MONGODB ENCERRADA');
    }
  } catch (error) {
    logger.error(
      '[BANCO DE DADOS]: ERRO AO DESCONECTAR DO MONGODB:',
      error.message,
    );
  }

  process.exit(0);
}
