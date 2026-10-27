# Backend e banco — Bloco 3

O backend usa rotas de recurso do React Router executadas no Cloudflare Worker. O navegador acessa apenas `/api/public/*`; a conexão com o Neon é criada no servidor com `@neondatabase/serverless`. O segredo `DATABASE_URL` nunca entra no bundle do navegador. As [rotas de recurso](https://reactrouter.com/how-to/resource-routes) e os [segredos do Worker](https://developers.cloudflare.com/workers/wrangler/environments/#secrets-in-local-development) seguem as interfaces oficiais.

## Estado atual

O projeto Neon foi conectado no desenvolvimento local em 27/10/2026. As migrations `001_initial.sql` e `002_motorcycle_media.sql` foram aplicadas e confirmadas em `schema_migrations`. O endpoint público de categorias respondeu HTTP 200 com lista vazia, como esperado antes dos cadastros. A configuração de produção no Cloudflare continua pendente.

## Criar o projeto e conectar

1. Crie um projeto PostgreSQL no [Neon](https://neon.tech/) e obtenha a string de conexão no painel do projeto. Para o Worker, use a URL adequada ao driver serverless. Para o executor de migrations, prefira uma URL direta em `MIGRATION_DATABASE_URL`; ele usa `pg` e transação com lock.
2. Copie `.dev.vars.example` para `.dev.vars`. Defina `DATABASE_URL` e, se houver URL direta distinta, `MIGRATION_DATABASE_URL`. O arquivo real é ignorado pelo Git. Não coloque credenciais em `wrangler.jsonc`, em arquivos React ou no chat.
3. Execute `npm run db:migrate`. O executor registra checksum em `schema_migrations`, recusa migrations já aplicadas que tenham sido modificadas e aplica novos arquivos dentro de uma transação. Se encontrar tabelas existentes sem histórico, ele para para revisão.
4. Reinicie `npm run dev` e consulte os endpoints abaixo. Com apenas a migration inicial aplicada, motos e categorias retornarão listas vazias; configurações conterão somente o nome informado no escopo.

Em produção, configure `DATABASE_URL` como segredo do Worker com `npx wrangler secret put DATABASE_URL`, em vez de gravá-lo no repositório. Nenhum deploy foi feito neste bloco.

## Migrations e tabelas

`database/migrations/001_initial.sql` cria `categories`, `motorcycles`, `motorcycle_images`, `motorcycle_features`, `store_settings`, `admin_users`, `admin_sessions` e `admin_login_attempts`, além de índices e gatilhos de `updated_at`. `002_motorcycle_media.sql` acrescenta operações atômicas para anúncios e fotos, tamanho do arquivo e fila de limpeza do R2. O preço é armazenado em centavos inteiros. As referências de fotos são chaves de armazenamento; nenhum binário vai para o Neon.

A migration cria apenas a linha de configuração com o nome “Marcos Motores”. Não cria motocicletas, categorias, contatos, endereço ou usuários administrativos fictícios.

## Endpoints públicos

| Método e rota | Resultado |
| --- | --- |
| `GET /api/public/motorcycles` | Lista paginada de anúncios publicados em categorias ativas. |
| `GET /api/public/motorcycles/:slug` | Detalhe de anúncio publicado, com metadados de imagens e características. |
| `GET /api/public/categories` | Categorias ativas. |
| `GET /api/public/store` | Informações públicas da loja. |

O endpoint de listagem aceita `q`, `brand`, `category`, `year`, `minPrice`, `maxPrice`, `minCc`, `maxCc`, `status`, `sort`, `featured`, `page` e `limit`. Valores inválidos retornam 400. `limit` fica entre 1 e 48. `sort` aceita `recent`, `price-asc`, `price-desc` e `mileage-asc`. Filtros são combinados com `AND`, e seus valores usam parâmetros SQL. A ordenação é escolhida de uma lista fixa.

Por padrão, a listagem inclui disponíveis e reservadas. `status=sold` exibe vendidas; `status=all` inclui os três estados. Slugs inexistentes ou anúncios não publicados retornam 404. Os endpoints não retornam observações administrativas, hash de senhas, sessões nem `storage_key` das imagens.

As fotos cadastradas recebem URLs de `/api/public/images/:imageId`. A rota lê o objeto no R2 somente quando o anúncio está publicado e a categoria está ativa. O fluxo de fotos ainda precisa ser validado com um administrador e um anúncio; o bucket de produção permanece pendente. Veja `docs/motorcycles.md`.

## Arquivos relevantes

- `app/server/db.server.ts`: conexão Neon exclusiva do servidor.
- `app/server/catalog-query.server.ts`: validação dos filtros e construção parametrizada da consulta.
- `app/server/public-repository.server.ts`: projeções públicas e consultas.
- `app/server/api.server.ts`: respostas JSON e erros sem detalhes internos.
- `app/routes/api.public.*.ts`: rotas HTTP.
- `scripts/migrate.mjs`: aplicação de migrations versionadas.
- `scripts/db-smoke.ts`: teste local do esquema e da visibilidade pública.
