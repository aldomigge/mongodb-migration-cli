#!/usr/bin/env node

import { program } from 'commander';
import displayHelp from '../src/commands/displayHelp.js';
import createCommand from '../src/commands/create.js';
import upCommand from '../src/commands/up.js';
import downCommand from '../src/commands/down.js';
// import fixImportCommand from '../src/commands/fixImport.js';
import initCommand from '../src/commands/init.js';
import testCommand from '../src/commands/test.js';
import allCollectionsCommand from '../src/commands/allCollections.js';
import allMigrationsCommand from '../src/commands/allMigrations.js';

program
  .command('create <name>')
  .description('Cria um novo arquivo de migração')
  .option('--src <src>', 'Especifica o diretório de destino')
  .action(createCommand);

program
  .command('up')
  .description('Rodar todas as migrações pendentes ou uma migração específica')
  .option('--file <file>', 'Especifica o arquivo de migração')
  .action(upCommand);

program
  .command('down')
  .description(
    'Desfazer a última migração executada, uma migração específica ou todas as migrações',
  )
  .option('--file <file>', 'Especifica o arquivo de migração')
  .option('--all', 'Desfazer todas as migrações')
  .action(downCommand);

// program
//   .command('fix-import')
//   .description('Corrige a importação de módulos em arquivos de migração')
//   .action(fixImportCommand);

program
  .command('init')
  .description('Gera um arquivo de configuração migration.config.json')
  .option('--overwrite', 'Sobrescreve o arquivo de configuração existente')
  .action(initCommand);

program
  .command('all-collections')
  .description('Lista todas as coleções do banco de dados')
  .action(allCollectionsCommand);

program
  .command('all-migrations')
  .description('Lista todas as migrações executadas')
  .action(allMigrationsCommand);

program
  .command('test')
  .description('Testa a conexão com o banco de dados')
  .action(testCommand);

program.helpOption('-h, --help', 'Exibe informações de ajuda');

program.on('--help', () => {
  displayHelp();
});

if (!process.argv.slice(2).length) {
  displayHelp();
}

program.parse(process.argv);
