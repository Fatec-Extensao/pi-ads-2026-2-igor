# Banco de Dados I

**Professor:** Prof. Luiz Fernando de Oliveira Silva

Esta pasta documenta o modelo físico e scripts acadêmicos para o Sistema Web para Gestão de Pesquisas por Questionários.

## Artefatos

- [Schema físico PostgreSQL (`schema.sql`)](./schema.sql): tabelas, chaves, restrições, funções e gatilhos para o modelo acadêmico.
- [Povoamento e consultas (`queries.sql`)](./queries.sql): dados totalmente fictícios e consultas agregadas para relatórios.

O modelo mantém usuários, pesquisas, categorias, questões, opções e participações em tabelas próprias. A resposta anônima e seus itens não guardam uma chave direta para o usuário. A função `finalizar_questionario` valida o token e os itens, cria a resposta em transação, marca a participação como concluída e consome o token.

O exemplo pressupõe questões fechadas, uma opção por questão e preenchimento completo. Não implementa texto livre, escolha múltipla, edição de respostas ou integração com a interface. A separação lógica reduz a associação direta, mas não prova anonimato contra inferência, logs ou grupos pequenos.

## Execução do exemplo

Os scripts foram escritos para PostgreSQL 18 e devem ser lidos e executados somente em banco de teste descartável e vazio, nesta ordem: `schema.sql`, depois `queries.sql`. `queries.sql` contém `INSERT` e consumo de tokens de demonstração; não executar em produção. Os nomes, e-mails, hashes e respostas são fictícios e não são credenciais válidas.

O DDL é um modelo acadêmico para revisão, não uma migração de banco existente. Antes de uso real, rever permissões, gestão de tokens, autenticação, privacidade, retenção, expurgo, recuperação e compatibilidade com a versão instalada do PostgreSQL. Nenhum teste de execução do banco foi realizado nesta entrega.
