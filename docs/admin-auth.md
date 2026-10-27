# Autenticação administrativa — Bloco 4

O painel fica em `/admin` e a entrada em `/admin/login`. As páginas protegidas consultam uma sessão no Neon antes de retornar dados. O Neon está conectado localmente, mas ainda não há administrador criado; portanto, ninguém consegue entrar.

## Ativação

1. Crie o projeto Neon e configure `DATABASE_URL` em `.dev.vars`, conforme `docs/backend.md`.
2. Execute `npm run db:migrate`.
3. Em um terminal interativo, execute `npm run admin:create`. Informe o e-mail e uma senha de 12 a 128 caracteres. A senha é lida sem eco e armazenada somente como hash.
4. Reinicie `npm run dev` e acesse `/admin/login`.
5. Em produção, configure `DATABASE_URL` como segredo do Worker e crie o administrador no banco correto antes do deploy. Não há usuário nem senha padrão.

O script de criação rejeita e-mails duplicados. Para recuperar o acesso, um operador com acesso autorizado ao banco deve seguir um procedimento de redefinição; não existe recuperação por e-mail neste bloco.

## Proteções implementadas

- Senhas usam PBKDF2-HMAC-SHA-256 com sal aleatório e 600 mil iterações, seguindo a [recomendação da OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). O [Web Crypto do Cloudflare Workers](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/) suporta PBKDF2.
- O navegador recebe um token aleatório em cookie `HttpOnly`, `SameSite=Strict`, `Path=/`, com `Secure` em HTTPS. O Neon armazena apenas o SHA-256 do token. A sessão expira em 12 horas e o logout revoga o registro no servidor.
- O login aplica bloqueio temporário por e-mail após 5 falhas e por IP após 20 falhas em uma janela de 15 minutos. A resposta para credenciais inválidas não revela se o usuário existe.
- POSTs de login e logout exigem `Origin` igual à origem da requisição. Destinos de retorno são limitados a rotas internas de `/admin`.
- O dashboard e o layout verificam a sessão no servidor. Dados administrativos não são armazenados no navegador como fonte de autorização e respostas administrativas usam `Cache-Control: private, no-store`.

Cada endpoint ou ação administrativa criada nos próximos blocos deverá chamar `requireAdmin(request)` e, para mutações, `assertSameOrigin(request)` antes de tocar no banco.

## Dashboard

Mostra total de motocicletas cadastradas, disponíveis, reservadas, vendidas, quantidade de categorias e os seis anúncios mais recentes. Os números são calculados no Neon. Navegação para CRUD de categorias e motocicletas aparecerá nos Blocos 5 e 6; os itens atuais do menu estão visíveis como indicação de estrutura, sem links ativos.

## Verificação

```sh
npm run auth:smoke
npm run typecheck
npm run lint
npm run build
```

`auth:smoke` valida hash, token, atributos do cookie, checagem de origem e redirecionamento. O fluxo completo de login, consulta do dashboard e logout no Neon real ainda depende da criação do primeiro administrador.
