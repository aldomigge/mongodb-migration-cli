const displayHelp = () => {
  console.log(`
    Uso: cli-migration [comando] [opções]

    Comandos:
      create <name>         Cria um novo arquivo de migração
      run <up>              Rodar todas as migrações pendentes
      run <down>            Desfazer a última migração executada
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
      migration init
      migration test
      migration all-collections
      migration all-migrations
      migration help
  `);
};

export default displayHelp;

// fix-import            Corrige a importação de módulos em arquivos de migração
// migration fix-import
