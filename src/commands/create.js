import path from 'node:path';
import fs from 'node:fs';

import { migrationTemplateJS } from '../template.js';
import { getTimestamp } from '../util.js';
import { loadConfig } from '../config.js';
import logger from '../log.js';

const {
  migrations: { directory, ext },
} = loadConfig();

const createCommand = (name, options) => {
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
};

export default createCommand;
