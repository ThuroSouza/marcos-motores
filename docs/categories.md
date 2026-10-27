# Categorias — Bloco 5

O painel administrativo oferece listagem em `/admin/categorias`, criação, edição e confirmação de exclusão. Todas as páginas e ações verificam a sessão no servidor; ações POST também conferem a origem da requisição.

## Regras

- Nome obrigatório (até 120 caracteres), slug único (até 140; letras minúsculas, números e hífens) e descrição opcional (até 2.000 caracteres).
- Categorias podem ficar ativas ou inativas. A API `/api/public/categories` retorna somente as ativas.
- Categorias vinculadas a motocicletas não podem ser excluídas. A tela mostra o vínculo; a operação confirma novamente no banco e a chave estrangeira impede uma exclusão concorrente.
- O slug é usado nos filtros públicos. Alterá-lo muda o valor selecionável no catálogo.
- Nenhuma categoria fictícia é gravada no Neon. O esquema inicial já continha a tabela `categories`, então este bloco não exigiu uma nova migration.

O Neon está configurado no desenvolvimento local. Categorias ativas cadastradas entram automaticamente nas opções do filtro de `/motos` e no formulário administrativo de motocicletas. A vitrine usa apenas anúncios reais publicados.

## Verificação

```sh
npm run categories:smoke
npm run typecheck
npm run lint
npm run build
```

O teste local executa a migration em um PostgreSQL isolado e valida criação, edição, slug duplicado, categoria inativa e exclusão com dependência. A validação completa no painel ainda precisa de um administrador criado conforme `docs/admin-auth.md`.
