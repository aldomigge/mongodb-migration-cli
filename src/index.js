#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { program } from 'commander';
import mongoose from 'mongoose';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootConfigPath = path.join(process.cwd(), 'migration.config.json');
const localConfigPath = path.join(__dirname, 'migration.config.json');

let configPath;

if (fs.existsSync(rootConfigPath)) {
  configPath = rootConfigPath;
} else if (fs.existsSync(localConfigPath)) {
  configPath = localConfigPath;
} else {
  console.error(
    'Arquivo de configuração "migration.config.json" não encontrado',
  );
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const { collection, directory, ext } = config.migrations;

const logger = createLogger();

function createLogger() {
  return pino({
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  });
}

mongoose.set('strict', true);

let mongoConnection = null;

async function connectToMongoDB({ logger_flag = false } = {}) {
  if (mongoConnection) return mongoConnection;

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
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

async function disconnectFromMongoDB({ logger_flag = false } = {}) {
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

async function getCollectionByName(collectionName) {
  try {
    if (
      !!config.collections.length &&
      !config.collections.includes(collectionName)
    ) {
      logger.error(
        `[MODELO]: ERRO: A COLEÇÃO ${collectionName} NÃO ESTÁ PERMITIDA. ADICIONE A COLEÇÃO AO ARQUIVO DE CONFIGURAÇÃO "migration.config.json"`,
      );
      process.exit(1);
    }

    const connection = await connectToMongoDB({ logger_flag: true });

    return connection.db.collection(collectionName);
  } catch (error) {
    logger.error(
      `[MODELO]: ERRO AO OBTER A COLEÇÃO ${collectionName}:`,
      error.message,
    );
    process.exit(1);
  }
}

async function getAllCollections() {
  try {
    const connection = await connectToMongoDB({ logger_flag: true });

    return connection.db.listCollections().toArray();
  } catch (error) {
    logger.error('[MODELO]: ERRO AO OBTER AS COLEÇÕES:', error.message);
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

const verifyCollectionExistsAndCreated = async () => {
  await connectToMongoDB({ logger_flag: false });

  const collections = await getAllCollections();

  if (!collections.find((col) => col.name === collection)) {
    await mongoose.connection.db.createCollection(collection);
    logger.info(`[INIT]: COLEÇÃO ${collection} CRIADA COM SUCESSO!`);
  }

  await disconnectFromMongoDB({ logger_flag: false });
};

const verifyCollection = async () => {
  await connectToMongoDB({ logger_flag: false });

  const collections = await getAllCollections();

  if (!collections.find((col) => col.name === collection)) {
    logger.error(
      `[INIT]: COLEÇÃO ${collection} NÃO ENCONTRADA. CRIE A COLEÇÃO MANUALMENTE OU EXECUTE O COMANDO "init" PARA CRIAR A COLEÇÃO AUTOMATICAMENTE.`,
    );
    process.exit(1);
  }

  await disconnectFromMongoDB({ logger_flag: false });
};

const displayHelp = () => {
  console.log(`
    Uso: cli-migration [comando] [opções]

    Comandos:
      create <name>         Cria um novo arquivo de migração
      run <up>              Rodar todas as migrações pendentes
      run <down>            Desfazer a última migração executada
      fix-import            Corrige a importação de módulos em arquivos de migração
      init                  Gera um arquivo de configuração migration.config.json
      test                  Testa a conexão com o banco de dados
      all-collections       Lista todas as coleções do banco de dados
      all-migrations        Lista todas as migrações executadas
      help                  Exibe esta mensagem de ajuda

    Opções:
      --src <src>           Especifica o diretório de destino
      --file <file>         Especifica o arquivo de migração ou rollback
      --all                 Rollback de todas as migrações

    Exemplos:
      migration create create_users_table
      migration create create_users_table --src ./src/migrations
      migration run up
      migration run up --file NomeDoArquivo
      migration run down
      migration run down --file NomeDoArquivo
      migration run down --all
      migration fix-import
      migration init
      migration test
      migration all-collections
      migration all-migrations
      migration help
  `);
};

const getTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

const migrationTemplateJS = () => `
import * as MigrationCli from '${path.relative(directory, __filename)}';

export const up = async () => {
  try {
    // TODO: Adicionar sua lógica de migração aqui

  } catch (error) {
    throw error;
  }
};

export const down = async () => {
  try {
    // TODO: Adicionar sua lógica de rollback aqui

  } catch (error) {
    throw error;
  }
};
`;

program
  .command('create <name>')
  .description('Cria um novo arquivo de migração')
  .option('--src <src>', 'Especifica o diretório de destino')
  .action((name, options) => {
    const timestamp = getTimestamp();
    const fileName = `${timestamp}_${name}${ext}`.replace(/[\s-]/g, '_');
    const dir = options.src || `${directory}`;

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
      logger.info(`[CREATE]: DIRETÓRIO CRIADO: ${dir}`);
    }

    const filePath = path.join(dir, fileName);
    const content = migrationTemplateJS();

    try {
      fs.writeFileSync(filePath, content, 'utf8');
      logger.info(`[CREATE]: ARQUIVO DE MIGRAÇÃO CRIADO: ${fileName}`);
      logger.info(`[CREATE]: ${filePath}`);
    } catch (error) {
      logger.error(
        `[CREATE::ERROR]: ERROR AO CRIAR A MIGRAÇÃO: ${error.message}`,
      );
    }
  });

program
  .command('up')
  .description('Rodar todas as migrações pendentes ou uma migração específica')
  .option('--file <file>', 'Especifica o arquivo de migração')
  .action(async (options) => {
    await connectToMongoDB({ logger_flag: false });

    try {
      const migrationsFiles = options.file
        ? [
            path.join(
              directory,
              options.file.endsWith(ext)
                ? options.file
                : `${options.file}${ext}`,
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

          await mongoose.connection.db
            .collection(collection)
            .insertOne({ name: migrationName, executed_at: new Date() });

          logger.info(`[UP]: MIGRAÇÃO ${migrationName} EXECUTADA COM SUCESSO!`);
        }
      }
    } catch (error) {
      logger.error('[UP::ERROR]: Erro ao executar a migração:', error.message);
      console.log(error);
    } finally {
      await disconnectFromMongoDB();
    }
  });

program
  .command('down')
  .description(
    'Desfazer a última migração executada, uma migração específica ou todas as migrações',
  )
  .option('--file <file>', 'Especifica o arquivo de migração')
  .option('--all', 'Desfazer todas as migrações')
  .action(async (options) => {
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
          logger.info(
            `[DOWN]: MIGRAÇÃO ${migrationName} DESFEITA COM SUCESSO!`,
          );

          await mongoose.connection.db
            .collection(collection)
            .deleteOne({ name: migrationName });
        }
      }
    } catch (error) {
      console.log(error);
      logger.error(
        '[DOWN::ERROR]: Erro ao desfazer a migração:',
        error.message,
      );
    } finally {
      await disconnectFromMongoDB();
    }
  });

program
  .command('fix-import')
  .description('Corrige a importação de módulos em arquivos de migração')
  .action(() => {
    const migrationsFiles = fs
      .readdirSync(directory)
      .filter((file) => file.endsWith(ext))
      .map((file) => path.join(directory, file));

    for (const file of migrationsFiles) {
      const migrationContent = fs.readFileSync(file, 'utf8');

      const newMigrationContent = migrationContent.replace(
        /import\s+\*\s+as\s+MigrationCli\s+from\s+['"].+?['"];/g,
        `import * as MigrationCli from '${path.relative(
          path.dirname(file),
          __filename,
        )}';`,
      );

      fs.writeFileSync(file, newMigrationContent, 'utf8');
    }

    logger.info('[FIX-IMPORT]: IMPORTAÇÕES CORRIGIDAS COM SUCESSO!');
  });

program
  .command('init')
  .description('Gera um arquivo de configuração migration.config.json')
  .option('--overwrite', 'Sobrescreve o arquivo de configuração existente')
  .action((option) => {
    const configTemplate = {
      mongodb: {
        uri: 'mongodb://localhost:27017',
        user: '',
        password: '',
        database: 'migration',
        options: {},
      },
      migrations: {
        collection: 'migrations',
        directory: './migrations',
        ext: '.js',
      },
    };

    if (fs.existsSync(configPath) && !option.overwrite) {
      logger.error(
        '[INIT]: O arquivo de configuração migration.config.json já existe. Use a opção --overwrite para sobrescrever o arquivo existente.',
      );
      process.exit(1);
    }

    fs.writeFileSync(configPath, JSON.stringify(configTemplate, null, 2));

    logger.info(
      '[INIT]: Arquivo de configuração migration.config.json gerado com sucesso!',
    );
  });

program
  .command('test')
  .description('Testa a conexão com o banco de dados')
  .action(async () => {
    await connectToMongoDB({ logger_flag: true });
    await disconnectFromMongoDB({ logger_flag: true });
  });

program
  .command('all-collections')
  .description('Lista todas as coleções do banco de dados')
  .action(async () => {
    await connectToMongoDB({ logger_flag: true });

    const collections = await getAllCollections();

    logger.info('[ALL-COLLECTIONS]: COLEÇÕES ENCONTRADAS:');
    collections.forEach((collection) => logger.info(collection.name));

    await disconnectFromMongoDB({ logger_flag: true });
  });

program
  .command('all-migrations')
  .description('Lista todas as migrações executadas')
  .action(async () => {
    await connectToMongoDB({ logger_flag: true });

    const migrations = await mongoose.connection.db
      .collection(collection)
      .find()
      .toArray();

    if (migrations.length === 0) {
      logger.info('[ALL-MIGRATIONS]: NENHUMA MIGRAÇÃO ENCONTRADA');
      return;
    }

    logger.info('[ALL-MIGRATIONS]: MIGRAÇÕES ENCONTRADAS:');
    migrations.forEach((migration) => logger.info(migration));

    await disconnectFromMongoDB({ logger_flag: true });
  });

program.helpOption('-h, --help', 'Exibe informações de ajuda');

program.on('--help', () => {
  displayHelp();
});

if (!process.argv.slice(2).length) {
  displayHelp();
}

program.parse(process.argv);
