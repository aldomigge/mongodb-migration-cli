import mongoose from 'mongoose';

import { connectToMongoDB } from './db.js';
import { loadConfig } from './config.js';
import logger from './log.js';

const { collections } = loadConfig();

async function getCollectionByName(collectionName) {
  try {
    if (!collections) {
      logger.error(
        `[MODELO]: ERRO: NÃO FOI POSSÍVEL ENCONTRAR A LISTA DE COLEÇÕES PERMITIDAS NO ARQUIVO DE CONFIGURAÇÃO "migration.config.json"`,
      );
      process.exit(1);
    }
    if (!!collections.length && !collections.includes(collectionName)) {
      logger.error(
        `[MODELO]: ERRO: A COLEÇÃO ${collectionName} NÃO ESTÁ PERMITIDA. ADICIONE A COLEÇÃO AO ARQUIVO DE CONFIGURAÇÃO "migration.config.json"`,
      );
      process.exit(1);
    }

    const connection = await connectToMongoDB({ logger_flag: true });

    return connection.db.collection(collectionName);
  } catch (error) {
    console.error(error);
    logger.error(
      `[MODELO]: ERRO AO OBTER A COLEÇÃO ${collectionName}:`,
      error.message,
    );
    process.exit(1);
  }
}

/**
 * @typedef {object} Document
 * @param {string} collectionName
 * @param {Document} document
 * @returns {Promise}
 * @description Insere um documento na coleção
 * @example insertOne('users', { name: 'Alice' })
 */
export async function insertOne(collectionName, document) {
  try {
    const collection = await getCollectionByName(collectionName);

    return collection.insertOne(document);
  } catch (error) {
    logger.error(
      `[MODELO]: ERRO AO INSERIR DOCUMENTO NA COLEÇÃO ${collectionName}:`,
      error.message,
    );
    process.exit(1);
  }
}

/**
 * @typedef {object} Document
 * @param {string} collectionName
 * @param {Document[]} documents
 * @returns {Promise}
 * @description Insere vários documentos na coleção
 * @example insertMany('users', [{ name: 'Jean' }, { name: 'Mikaio' }, { name: 'Aldo' }])
 */
export async function insertMany(collectionName, documents) {
  try {
    const collection = await getCollectionByName(collectionName);

    return collection.insertMany(documents);
  } catch (error) {
    logger.error(
      `[MODELO]: ERRO AO INSERIR DOCUMENTOS NA COLEÇÃO ${collectionName}:`,
      error.message,
    );
    process.exit(1);
  }
}

/**
 * @typedef {mongoose.FilterQuery<any>} FilterQuery
 * @typedef {mongoose.UpdateQuery<any>} Update
 * @param {string} collectionName
 * @param {FilterQuery} filter
 * @param {Update} update
 * @returns {Promise}
 * @description Atualiza um documento na coleção com base em um filtro
 * @example updateOne('users', { email: 'exemplo@email.com' }, { $set: { active: true } })
 */
export async function updateOne(collectionName, filter, update) {
  try {
    const collection = await getCollectionByName(collectionName);

    return collection.updateOne(filter, update);
  } catch (error) {
    logger.error(
      `[MODELO]: ERRO AO ATUALIZAR DOCUMENTO NA COLEÇÃO ${collectionName}:`,
      error.message,
    );
    process.exit(1);
  }
}

/**
 * @typedef {mongoose.FilterQuery<any>} FilterQuery
 * @typedef {mongoose.UpdateQuery<any>} UpdateQuery
 * @param {string} collectionName
 * @param {FilterQuery} filter
 * @param {UpdateQuery} update
 * @returns {Promise}
 * @description Atualiza vários documentos na coleção com base em um filtro
 * @example updateMany('users', { age: { $lt: 18 } }, { $set: { underage: true } })
 */
export async function updateMany(collectionName, filter, update) {
  try {
    const collection = await getCollectionByName(collectionName);

    return collection.updateMany(filter, update);
  } catch (error) {
    logger.error(
      `[MODELO]: ERRO AO ATUALIZAR DOCUMENTOS NA COLEÇÃO ${collectionName}:`,
      error.message,
    );
    process.exit(1);
  }
}

/**
 * @typedef {mongoose.FilterQuery<any>} FilterQuery
 * @param {string} collectionName
 * @param {FilterQuery} filter
 * @returns {Promise}
 * @description Deleta um documento na coleção com base em um filtro
 * @example deleteOne('users', { email: 'exemplo@email.com' })
 */
export async function deleteOne(collectionName, filter) {
  try {
    const collection = await getCollectionByName(collectionName);

    return collection.deleteOne(filter);
  } catch (error) {
    logger.error(
      `[MODELO]: ERRO AO DELETAR DOCUMENTO NA COLEÇÃO ${collectionName}:`,
      error.message,
    );
    process.exit(1);
  }
}

/**
 * @typedef {mongoose.FilterQuery<any>} FilterQuery
 * @param {string} collectionName
 * @param {FilterQuery} filter
 * @returns {Promise}
 * @description Deleta vários documentos na coleção com base em um filtro
 * @example deleteMany('users', { age: { $lt: 18 } })
 */
export async function deleteMany(collectionName, filter) {
  try {
    const collection = await getCollectionByName(collectionName);

    return collection.deleteMany(filter);
  } catch (error) {
    logger.error(
      `[MODELO]: ERRO AO DELETAR DOCUMENTOS NA COLEÇÃO ${collectionName}:`,
      error.message,
    );
    process.exit(1);
  }
}

/**
 * @typedef {mongoose.FilterQuery<any>} FilterQuery
 * @param {string} collectionName
 * @param {FilterQuery} query
 * @returns {Promise<number>}
 * @description Conta os documentos na coleção com base em um filtro
 * @example countDocuments('users', { age: { $gte: 18 } })
 */
export async function countDocuments(collectionName, query = {}) {
  try {
    const collection = await getCollectionByName(collectionName);

    return collection.countDocuments(query);
  } catch (error) {
    logger.error(
      `[MODELO]: ERRO AO CONTAR DOCUMENTOS NA COLEÇÃO ${collectionName}:`,
      error.message,
    );
    process.exit(1);
  }
}

/**
 * @typedef {mongoose.PipelineStage} PipelineStage
 * @param {string} collectionName
 * @param {PipelineStage[]} pipeline
 * @returns {Promise<any[]>}
 * @description Realiza uma operação de agregação na coleção
 * @example aggregate('users', [
 * { $match: { age: { $gte: 18 } } },
 * { $group: { _id: '$city', total: { $sum: 1 } } }
 * ])
 */
export async function aggregate(collectionName, pipeline) {
  try {
    const collection = await getCollectionByName(collectionName);

    return collection.aggregate(pipeline).toArray();
  } catch (error) {
    logger.error(
      `[MODELO]: ERRO AO REALIZAR AGGREGATION NA COLEÇÃO ${collectionName}:`,
      error.message,
    );
    process.exit(1);
  }
}

/**
 * @typedef {mongoose.FilterQuery<any>} FilterQuery
 * @param {string} collectionName
 * @param {FilterQuery} query
 * @returns {Promise<boolean>}
 * @description Verifica se um documento existe na coleção
 * @example exists('users', { email: 'exemplo@email.com' })
 */
export async function exists(collectionName, query = {}) {
  try {
    const collection = await getCollectionByName(collectionName);

    return collection.findOne(query) !== null;
  } catch (error) {
    logger.error(
      `[MODELO]: ERRO AO VERIFICAR A EXISTÊNCIA DE DOCUMENTOS NA COLEÇÃO ${collectionName}:`,
      error.message,
    );
    process.exit(1);
  }
}

/**
 * @typedef {mongoose.FilterQuery<any>} FilterQuery
 * @param {string} collectionName
 * @param {FilterQuery} query
 * @returns {Promise<any[]>}
 * @description Busca vários documentos na coleção com base em um filtro. Pode ser usado para buscar todos os documentos da coleção.
 * @example findOne('users', { email: 'exemplo@email.com' })
 */
export async function find(collectionName, query = {}) {
  try {
    const collection = await getCollectionByName(collectionName);

    return collection.find(query).toArray();
  } catch (error) {
    console.error(error);
    logger.error(
      `[MODELO]: ERRO AO OBTER A COLEÇÃO${collectionName}:`,
      error.message,
    );
    process.exit(1);
  }
}

/**
 * @typedef {mongoose.FilterQuery<any>} FilterQuery
 * @param {string} collectionName
 * @param {FilterQuery} query
 * @returns {Promise<any>}
 * @description Busca um documento na coleção com base em um filtro. Retorna o primeiro documento encontrado.
 * @example findOne('users', { email: 'exemplo@email.com' })
 */
export async function findOne(collectionName, query = {}) {
  try {
    const collection = await getCollectionByName(collectionName);
    return collection.findOne(query);
  } catch (error) {
    logger.error(
      `[MODELO]: ERRO AO OBTER A COLEÇÃO ${collectionName}:`,
      error.message,
    );
    process.exit(1);
  }
}
