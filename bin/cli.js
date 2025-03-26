#!/usr/bin/env node

import { program } from 'commander';
import displayHelp from '../src/commands/displayHelp.js';
import createCommand from '../src/commands/create.js';
import upCommand from '../src/commands/up.js';
import downCommand from '../src/commands/down.js';
import initCommand from '../src/commands/init.js';
import testCommand from '../src/commands/test.js';
import allCollectionsCommand from '../src/commands/allCollections.js';
import allMigrationsCommand from '../src/commands/allMigrations.js';
import registerCommand from '../src/commands/register.js';
import unregisterCommand from '../src/commands/unregister.js';
import safeLockCommand from '../src/commands/safeLock.js';
import safeUnlockCommand from '../src/commands/safeUnlock.js';

program
  .command('create <name>')
  .description('Cria um novo arquivo de migração')
  .option('--src <src>', 'Especifica o diretório de destino')
  .action(createCommand);

program
  .command('up')
  .description('Rodar todas as migrações pendentes ou uma migração específica')
  .option('--file <file>', 'Especifica o arquivo de migração')
  .option('--safe', 'Adiciona a migração como segura. Essa flag só é válida para uma migração específica')
  .action(upCommand);

program
  .command('down')
  .description(
    'Desfazer a última migração executada, uma migração específica ou todas as migrações',
  )
  .option('--file <file>', 'Especifica o arquivo de migração')
  .option('--all', 'Desfazer todas as migrações')
  .option('--force', 'Forçar a execução da migração')
  .action(downCommand);

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

program
  .command('register')
  .description('Registra uma nova migração no banco de dados')
  .option('--file <file>', 'Especifica o arquivo de migração')
  .option('--safe', 'Define a migração como segura')
  .action(registerCommand);

program
  .command('unregister')
  .description('Remove o registro de uma migração do banco de dados')
  .option('--file <file>', 'Especifica o arquivo de migração')
  .action(unregisterCommand);

program
  .command('safe-lock')
  .description('Define uma migração como segura, alterando qualquer outra migração segura existente para não segura')
  .option('--file <file>', 'Especifica o arquivo de migração')
  .action(safeLockCommand);

program
  .command('safe-unlock')
  .description('Remove o status de segura de uma migração')
  .option('--file <file>', 'Especifica o arquivo de migração')
  .action(safeUnlockCommand);

program.version('1.0.0', '-v, --version', 'Exibe a versão do programa');

program.helpOption('-h, --help', 'Exibe informações de ajuda');

program.on('--help', () => {
  displayHelp();
});

if (!process.argv.slice(2).length) {
  displayHelp();
}

program.parse(process.argv);
