# MongoDB Migration CLI

Uma ferramenta de linha de comando para gerenciar migrações de banco de dados MongoDB. Com essa CLI, você pode criar novas migrações, rodar migrações pendentes, desfazer migrações, listar migrações executadas, testar a conexão com o banco de dados, e muito mais.

## 📦 Instalação

Primeiro, clone o repositório e instale as dependências:

```bash
git clone https://github.com/clepverse/mongodb-migration-cli.git
cd mongodb-migration-cli
npm install
```

## 🛠️ Comandos

### Criar nova migração
```bash
migration create <nome-da-migracao> [--src <diretorio>]
```
**Parâmetros:**
- `nome-da-migracao` - Nome da migração (obrigatório)
- `--src` - Diretório de destino (opcional)

### ⬆️ Executar migrações
```bash
migration up [--file <arquivo>]
```
**Opções:**
- `--file` - Executa uma migração específica

### ⬇️ Reverter migrações
```bash
migration down [--file <arquivo>] [--all]
```
**Opções:**
- `--file` - Reverte migração específica
- `--all` - Reverte todas as migrações

### ⚙️ Configuração inicial
```bash
migration init [--overwrite]
```
**Opções:**
- `--overwrite` - Sobrescreve configuração existente

### 📋 Listagens
```bash
migration all-collections       # Lista coleções
migration all-migrations        # Lista migrações
migration test                  # Testa conexão
migration --help                # Ajuda
```

## 📌 Exemplos de Uso

1. Criar migração:
```bash
migration create nova-tabela --src ./db/migrations
```

2. Executar todas as migrações:
```bash
migration up
```

3. Reverter migração específica:
```bash
migration down --file 20240510-nova-tabela.js
```

4. Inicializar configuração:
```bash
migration init --overwrite
```

## ⚙️ Estrutura de Configuração

Arquivo `migration.config.json`:
```json
{
  "mongodb": {
    "uri": "mongodb://localhost:27017",
    "user": "root",
    "password": "example",
    "database": "playground-migration",
    "options": {}
  },
  "migrations": {
    "collection": "migrations",
    "directory": "migrations",
    "ext": ".js"
  },
  "collections": [ "users"]
}
```