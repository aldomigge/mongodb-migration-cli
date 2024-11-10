import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import logger from './log.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootConfigPath = path.join(process.cwd(), 'migration.config.json');
const localConfigPath = path.join(__dirname, 'migration.config.json');

export function loadConfig() {
  const { exists, path } = verifyIfConfigExists();

  if (!exists) {
    logger.error(
      '[CONFIG]: O arquivo de configuração migration.config.json não foi encontrado. Execute o comando `migration init` para gerar o arquivo.',
    );
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

export function saveConfig(config) {
  fs.writeFileSync(rootConfigPath, JSON.stringify(config, null, 2));
}

export function verifyIfConfigExists() {
  let configPath;

  if (fs.existsSync(rootConfigPath)) {
    configPath = rootConfigPath;
  } else if (fs.existsSync(localConfigPath)) {
    configPath = localConfigPath;
  }

  return {
    exists: !!configPath,
    path: configPath,
  };
}
