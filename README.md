# Marcos Motores

Base do sistema web da Marcos Motores. Os **Blocos 1 a 7** incluem React/TypeScript, renderização no servidor via React Router e Cloudflare Workers, Tailwind, esquema PostgreSQL versionado, autenticação, cadastros administrativos e catálogo público conectado ao Neon. O código de fotos com R2 permanece disponível para uso futuro, mas o deploy atual não configura esse serviço.

O Neon está conectado no desenvolvimento local e as migrations `001_initial.sql` e `002_motorcycle_media.sql` foram aplicadas. Ainda não há usuário administrativo. Sem armazenamento de fotos, o painel permite apenas rascunhos de motos; o catálogo público não exibe estoque fictício. WhatsApp e informações institucionais oficiais aguardam o Bloco 8.

Site publicado: [marcos-motores.arthurosouza99.workers.dev](https://marcos-motores.arthurosouza99.workers.dev).

## Requisitos

- Node.js 22 ou superior
- npm

## Desenvolvimento

```sh
npm ci
npm run dev
```

Abra `http://localhost:5173`. As páginas públicas não exigem login. Sem `DATABASE_URL`, início e catálogo exibem estado de indisponibilidade com HTTP 503.

## Verificações

```sh
npm run typecheck
npm run lint
npm run build
npm run db:smoke
npm run auth:smoke
npm run categories:smoke
npm run motorcycles:smoke
npm run images:smoke
npm run catalog:smoke
npm run deploy:check
```

## Estrutura

- `app/routes.ts`: definição das rotas.
- `app/routes/`: arquivos individuais de início, catálogo, detalhes, sobre, contato e layout público.
- `app/components/layout/`: marca provisória em texto, cabeçalho e rodapé.
- `app/components/motorcycle/`: card de anúncio e galeria com miniaturas e gestos de deslizar.
- `app/components/filters/`: formulário responsivo de filtros combinados.
- `app/server/public-repository.server.ts`: consultas do catálogo real, opções de filtros, página inicial e anúncios semelhantes.
- `app/types/` e `app/utils/`: contratos de dados e formatação.
- `app/app.css`: tokens preto e dourado, estilos globais e componentes visuais básicos.
- `public/demo/`: imagens sintéticas históricas do protótipo; uma imagem ilustrativa permanece no banner inicial e outra na página institucional provisória.
- `workers/app.ts`: entrada do Cloudflare Worker para renderização no servidor.
- `wrangler.jsonc`: configuração inicial do Worker, sem segredos.
- `database/migrations/`: esquema PostgreSQL versionado.
- `app/server/` e `app/routes/api.public.*.ts`: consultas e endpoints públicos do backend.
- `docs/backend.md`: contrato da API, regras de visibilidade e instruções para conectar o Neon.
- `docs/admin-auth.md`: autenticação, criação do primeiro administrador e proteção do painel.
- `docs/categories.md`: regras e validação do cadastro de categorias.
- `docs/motorcycles.md`: CRUD de anúncios, fotos no R2 e configuração pendente.
- `docs/catalog.md`: regras de exibição, filtros e estados do catálogo público.
- `docs/deployment.md`: preparação, segredos e verificação da publicação no Cloudflare sem R2.
- `app/routes/admin.*`: login, logout, layout e dashboard administrativos.

O símbolo “MM” é provisório até a empresa disponibilizar a logomarca oficial.

## Comportamento do catálogo público

- Por padrão, `/motos` mostra disponíveis e reservadas; vendidas aparecem ao selecionar o filtro correspondente ou “Todas”.
- Anúncios vendidos continuam acessíveis por URL, mas não mostram botão de interesse.
- Filtros por texto, marca, categoria, ano, preço, cilindrada e status são combinados; a ordenação é aplicada ao resultado.
- Os parâmetros ficam na URL para permitir compartilhar uma busca. O botão “Limpar pesquisa” volta ao catálogo padrão.
- Anúncios despublicados ou vinculados a categorias inativas não aparecem. Fotos de anúncios são lidas do R2 pela rota pública.

## Próximos blocos

Crie o primeiro administrador com `npm run admin:create`, conforme `docs/admin-auth.md`. Para publicar anúncios de motos, será necessário escolher e configurar um armazenamento de fotos. O deploy atual envia `DATABASE_URL` como segredo do Worker. WhatsApp e informações oficiais da loja serão conectados em blocos posteriores, após autorização específica para cada um.
