#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { program } = require('commander');
const pino = require('pino');
const mongoose = require('mongoose');

const rootConfigPath = path.join(process.cwd(), 'migration.config.json');
const localConfigPath = path.join(__dirname, 'migration.config.json');

let configPath;

if (fs.existsSync(rootConfigPath)) {
  configPath = rootConfigPath;
} else if (fs.existsSync(localConfigPath)) {
  configPath = localConfigPath;
} else {
  logger.error(
    'Arquivo de configuração "migration.config.json" não encontrado',
  );
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const { collection, directory, ext } = config.migrations;

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

mongoose.set('strict', true);

async function connectToMongoDB() {
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

    logger.info('[BANCO DE DADOS]: CONEXÃO COM MONGODB ESTABELECIDA');
  } catch (error) {
    logger.error(
      '[BANCO DE DADOS]: ERRO AO CONECTAR AO MONGODB:',
      error.message,
    );

    mongoose.disconnect();
    process.exit(1);
  }
}

const displayHelp = () => {
  console.log(`
    Uso: cli-migration [comando] [opções]

    Comandos:
      create <name>         Cria um novo arquivo de migração
      run <up>              Rodar todas as migrações pendentes
      run <down>            Desfazer a última migração executada
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

const currentFileName = path.basename(__filename);
console.log(path.join(__dirname, currentFileName));

const migrationTemplateJS = (migrationName) => `
const path = require('node:path');

const { connectToMongoDB } = require('${path.join(
  __dirname,
  currentFileName,
)}');

// Importe o modelo

const migrationName = path.basename(__filename, '.js');

module.exports = {
  up: async () => {
    await connectToMongoDB();

    try {
      // TODO: Adicionar sua lógica de migração aqui

    } catch (error) {
      console.error(
        \`Error ao executar a migration \${migrationName}: \${error.message}\`,
      );
    }
  },

  down: async () => {
    await connectToMongoDB();
    try {
      // TODO: Adicionar sua lógica de rollback aqui

    } catch (error) {
      console.error(
        \`Error ao reverter a migração \${migrationName}: \${error.message}\`,
      );
    }
  },
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
      logger.info(`[OK]: DIRETÓRIO CRIADO: ${dir}`);
    }

    const filePath = path.join(dir, fileName);
    const content = migrationTemplateJS(name);

    try {
      fs.writeFileSync(filePath, content, 'utf8');
      logger.info(`[OK]: ARQUIVO DE MIGRAÇÃO CRIADO: ${fileName}`);
      logger.info(`[PATH]: ${filePath}`);
    } catch (error) {
      logger.error(`[ERROR]: ERROR AO CRIAR A MIGRAÇÃO: ${error.message}`);
    }
  });

program
  .command('up')
  .description('Rodar todas as migrações pendentes ou uma migração específica')
  .option('--file <file>', 'Especifica o arquivo de migração')
  .action(async (options) => {
    await connectToMongoDB();

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
        logger.info('NENHUMA MIGRAÇÃO ENCONTRADA');
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

          logger.info(`EXECUTANDO A MIGRAÇÃO: ${migrationName}`);

          await migrationModule.up();

          await mongoose.connection.db
            .collection(collection)
            .insertOne({ name: migrationName });

          logger.info(`[OK]: MIGRAÇÃO ${migrationName} EXECUTADA COM SUCESSO!`);
        }
      }
    } catch (error) {
      logger.error('[ERROR]: Erro ao executar a migração:', error.message);
      console.log(error);
    } finally {
      await mongoose.disconnect();
      logger.info('[BANCO DE DADOS]: CONEXÃO COM MONGODB ENCERRADA');
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
    await connectToMongoDB();

    try {
      if (options.all) {
        const allMigrations = await mongoose.connection.db
          .collection(collection)
          .find()
          .sort({ _id: -1 })
          .toArray();

        if (allMigrations.length === 0) {
          logger.info('Nenhuma migração encontrada');
          return;
        }

        for (const migration of allMigrations) {
          const migrationName = migration.name;
          const migrationModule = await import(
            path.resolve(`${directory}/${migrationName}${ext}`)
          ).then((mod) => mod.default || mod);

          if (typeof migrationModule.down === 'function') {
            logger.info(`Desfazendo migração: ${migrationName}`);
            await migrationModule.down();
            logger.info(`Migração ${migrationName} desfeita com sucesso!`);

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
            logger.info('Nenhuma migração encontrada');
            return;
          }

          migrationName = lastMigration[0].name;
        }

        const migrationModule = await import(
          path.resolve(`${directory}/${migrationName}${ext}`)
        ).then((mod) => mod.default || mod);

        if (typeof migrationModule.down === 'function') {
          logger.info(`Desfazendo migração: ${migrationName}`);
          await migrationModule.down();
          logger.info(`Migração ${migrationName} desfeita com sucesso!`);

          await mongoose.connection.db
            .collection(collection)
            .deleteOne({ name: migrationName });
        }
      }
    } catch (error) {
      console.log(error);
      logger.error('Erro ao desfazer a migração:', error.message);
    } finally {
      await mongoose.disconnect();
      logger.info('[BANCO DE DADOS]: Conexão com MongoDB encerrada');
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
        /const { connectToMongoDB } = require\(.+?\);/g,
        `const { connectToMongoDB } = require('${path.join(
          __dirname,
          currentFileName,
        )}');`,
      );

      fs.writeFileSync(file, newMigrationContent, 'utf8');
    }

    logger.info('Importações corrigidas com sucesso!');
  });

program
  .command('generate-config')
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
        'O arquivo de configuração migration.config.json já existe. Use a opção --overwrite para sobrescrever o arquivo existente.',
      );
      process.exit(1);
    }

    fs.writeFileSync
      ? fs.writeFileSync(configPath, JSON.stringify(configTemplate, null, 2))
      : fs.writeFile(configPath, JSON.stringify(configTemplate, null, 2));

    logger.info(
      'Arquivo de configuração migration.config.json gerado com sucesso!',
    );
  });

program.helpOption('-h, --help', 'Exibe informações de ajuda');

program.on('--help', () => {
  displayHelp();
});

if (!process.argv.slice(2).length) {
  displayHelp();
}

program.parse(process.argv);

module.exports = {
  connectToMongoDB,
};
