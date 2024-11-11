const displayHelp = () => {
  console.log(`
    Uso: migration [comando] [opções]

    Comandos:
      create <name>         Cria um novo arquivo de migração
      run <up>              Rodar todas as migrações pendentes
      run <down>            Desfazer a última migração executada
      register              Registra uma nova migração no banco de dados(Não executa a migração)
      unregister            Remove o registro de uma migração do banco de dados(Não executa a migração)
      safe-lock             Torna a migração como uma migração segura(Trava de segurança)
      safe-unlock           Remove a trava de segurança de uma migração
      init                  Gera um arquivo de configuração migration.config.json
      test                  Testa a conexão com o banco de dados
      all-collections       Lista todas as coleções do banco de dados
      all-migrations        Lista todas as migrações executadas
      help                  Exibe esta mensagem de ajuda

    Opções:
      --src <src>           Especifica o diretório de destino
      --file <file>         Especifica o arquivo de migração ou rollback
      --all                 Rollback de todas as migrações
      --overwrite           Sobrescreve o arquivo de configuração existente
      --safe                Adiciona a migração como segura
      --force               Forçar a execução da migração
      --version             Exibe a versão do pacote

    Exemplos:
      migration create create_users_table
      migration create create_users_table --src ./src/migrations
      migration run up
      migration run up --file NomeDoArquivo
      migration run down
      migration run down --file NomeDoArquivo
      migration run down --all
      migration register --file NomeDoArquivo
      migration unregister --file NomeDoArquivo
      migration safe-lock --file NomeDoArquivo
      migration safe-unlock --file NomeDoArquivo
      migration init
      migration test
      migration all-collections
      migration all-migrations
      migration help
  `);
};

export default displayHelp;