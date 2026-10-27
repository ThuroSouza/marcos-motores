# Publicação no Cloudflare

O projeto usa React Router no Cloudflare Worker, com assets estáticos e Neon. O `wrangler.jsonc` define o Worker `marcos-motores` e o segredo obrigatório `DATABASE_URL`. A pedido da loja, esta publicação não usa R2 nem outro armazenamento de fotos.

## Estado verificado em 27/10/2026

- Neon conectado localmente; migrations `001_initial.sql` e `002_motorcycle_media.sql` aplicadas e verificadas no banco real.
- API pública respondeu HTTP 200 com listas vazias de categorias e motos, como esperado antes dos cadastros.
- `npm run deploy:check` concluiu o build e um `wrangler deploy --dry-run`, incluindo assets e o nome do segredo, sem publicar.
- Wrangler está autenticado na conta Cloudflare desta máquina.
- R2 não está ativado na conta e não será usado nesta publicação. O binding foi removido da configuração.
- Nenhum administrador existe no banco.
- Worker publicado em `https://marcos-motores.arthurosouza99.workers.dev` (versão `61f1bbeb-340a-4994-8af1-618d145a2488`). A página inicial, `/motos`, `/api/public/categories`, `/admin/login` e a imagem do banner responderam HTTP 200. O catálogo público ainda está vazio.

## Para operar o painel

1. Confirmar a conta Cloudflare com `npx wrangler whoami`.
2. Conferir que `.dev.vars` contém a `DATABASE_URL` do banco pretendido para produção. O arquivo é ignorado pelo Git. `MIGRATION_DATABASE_URL` não é enviado ao Worker.
3. Executar `npm run deploy:check` e revisar os avisos. O comando compila e simula o deploy, mas não publica.
4. Para usar o painel depois, criar o primeiro administrador pelo comando interativo `npm run admin:create`. O e-mail e a senha são informados localmente; não há credenciais padrão.

## Novas publicações

`npm run deploy` compila e publica o Worker. O script cria um arquivo temporário privado contendo **somente** `DATABASE_URL` e o passa a `wrangler deploy --secrets-file`; remove o arquivo ao terminar. Isso configura o segredo junto com a primeira versão sem expor a URL no comando ou enviar `MIGRATION_DATABASE_URL` ao Cloudflare.

### Publicação automática pelo GitHub

O repositório é `ThuroSouza/marcos-motores`, branch `main`. Para conectar o Worker já existente, em **Workers & Pages → marcos-motores → Settings → Builds**, escolha **Connect** e autorize o repositório no GitHub. Configure a branch de produção como `main`, o comando de build como `npm run build` e o comando de deploy como `npm run deploy:ci` (equivale a `wrangler deploy`). O nome do Worker no painel deve permanecer `marcos-motores`, igual ao `wrangler.jsonc`.

O `DATABASE_URL` já está configurado como segredo do Worker publicado. O build no Cloudflare não deve usar `.dev.vars`, que existe apenas nesta máquina e é ignorado pelo Git. Cada push na branch de produção atualizará o Worker; `npm run db:migrate` continua uma operação separada para mudanças de esquema no Neon. Dados cadastrados no painel entram no Neon imediatamente, sem commit ou deploy.

Após cada publicação, abrir a URL retornada pelo Wrangler e verificar `/`, `/motos`, `/api/public/categories` e `/admin/login`. Sem armazenamento de imagens, o painel permite salvar categorias e motos como rascunho, mas não oferece upload nem publicação de anúncios. Por isso, o catálogo público permanecerá vazio até a loja escolher uma solução para as fotos. A imagem do banner é ilustrativa e estática.

Domínio personalizado, logomarca, dados oficiais de contato e WhatsApp ainda dependem de decisões e informações da loja. A publicação inicial pode usar o subdomínio `workers.dev`; a configuração do domínio próprio pode ser feita depois.

Referências: [React Router em Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/), [segredos de Workers](https://developers.cloudflare.com/workers/configuration/secrets/).
