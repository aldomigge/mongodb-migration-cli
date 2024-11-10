import path from 'node:path';
import fs from 'node:fs';
import logger from '../log.js';

const fixImportCommand = () => {
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
};

export default fixImportCommand;
