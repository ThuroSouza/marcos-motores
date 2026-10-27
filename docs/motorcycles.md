# Motocicletas e fotografias — Bloco 6

O painel oferece listagem, busca, visualização, cadastro, edição e exclusão com confirmação em `/admin/motos`. O formulário controla características, disponibilidade, rascunho/publicação e destaque. Anúncios vendidos permanecem no banco até uma exclusão manual. As rotas e ações exigem sessão administrativa; alterações POST também verificam a origem.

## Fotografias

- O cadastro começa como rascunho. Após salvar, a tela de edição recebe até 12 fotos por anúncio, em lotes de até 3. Cada arquivo pode ter até 8 MB e deve ser JPEG, PNG, WebP ou AVIF. O servidor verifica tamanho, tipo declarado e assinatura do arquivo.
- A tela oferece prévia antes do envio, escolha da capa, reordenação e remoção. A primeira foto vira capa. A última foto removida despublica o anúncio automaticamente.
- Binários ficam no Cloudflare R2. O Neon guarda apenas chave, metadados, ordem e capa. A rota pública `/api/public/images/:imageId` só entrega fotos de anúncios publicados em categorias ativas; `/admin/imagens/:imageId` exige sessão.
- A migration `002_motorcycle_media.sql` inclui operações atômicas de anúncio e imagem, além de `r2_delete_jobs`. Se a exclusão no R2 falhar, a chave continua nessa fila. O botão “Processar limpeza pendente de fotos” em `/admin/motos` tenta novamente após cinco minutos. A limpeza ignora objetos ainda vinculados a imagens válidas.

O binding `MOTORCYCLE_IMAGES` está configurado em `wrangler.jsonc` para o bucket `marcos-motores-images`, seguindo a [configuração de R2 do Wrangler](https://developers.cloudflare.com/workers/wrangler/configuration/#r2-buckets) e a [API de R2 para Workers](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/). No desenvolvimento local, o Wrangler usa armazenamento R2 local; para produção, crie o bucket na conta Cloudflare antes do deploy. Nenhum bucket foi criado nem deploy executado neste bloco.

## Ativação com Neon e Cloudflare

1. Crie um projeto Neon e configure `DATABASE_URL` em `.dev.vars`, conforme `docs/backend.md`.
2. Execute `npm run db:migrate`; o executor aplicará `001_initial.sql` e `002_motorcycle_media.sql` na ordem.
3. Crie o primeiro administrador com `npm run admin:create`, conforme `docs/admin-auth.md`.
4. Use o painel para cadastrar uma categoria ativa, criar uma motocicleta como rascunho, enviar fotos e então publicar.
5. Antes do deploy, crie o bucket `marcos-motores-images` na conta Cloudflare e configure o segredo `DATABASE_URL` no Worker.

O Neon está conectado localmente e as duas migrations foram aplicadas. Ainda faltam o primeiro administrador e o bucket R2 de produção; o fluxo real de cadastro com foto continua pendente. Os testes automatizados usam PostgreSQL isolado e um bucket R2 simulado.

## Verificação

```sh
npm run motorcycles:smoke
npm run images:smoke
npm run typecheck
npm run lint
npm run build
```

`motorcycles:smoke` valida o ciclo do anúncio, fotos, publicação, status, capa, ordem e exclusão com a migration real. `images:smoke` valida upload, formato de arquivo, acesso público apenas a anúncios publicados e recuperação de falha de exclusão no R2.

A vitrine `/motos` consulta os anúncios publicados no banco; veja `docs/catalog.md`. Sem Neon, mostra indisponibilidade em vez de anúncios fictícios.
