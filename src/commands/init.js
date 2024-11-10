import fs from 'node:fs';
import logger from '../log.js';

import { verifyIfConfigExists } from '../config.js';

const initCommand = (option) => {
  const { exists, path } = verifyIfConfigExists();

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
    collections: [],
  };

  const configPath = path || './migration.config.json';

  if (exists && !option.overwrite) {
    logger.error(
      '[INIT]: O arquivo de configuração migration.config.json já existe. Use a opção --overwrite para sobrescrever o arquivo existente.',
    );
    process.exit(1);
  }

  fs.writeFileSync(configPath, JSON.stringify(configTemplate, null, 2));

  logger.info(
    '[INIT]: Arquivo de configuração migration.config.json gerado com sucesso!',
  );
};

export default initCommand;
