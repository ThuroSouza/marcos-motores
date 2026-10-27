# Catálogo público — Bloco 7

A foto da motocicleta no banner inicial é uma imagem visual ilustrativa fixa. Ela não representa um anúncio disponível; cards, filtros e páginas de motos usam somente anúncios publicados no banco.

As páginas `/`, `/motos` e `/motos/:slug` consultam o Neon no servidor. Anúncios fictícios não são usados nessas páginas. A foto do banner inicial é ilustrativa e independente do catálogo.

## Regras de exibição

- Apenas motos publicadas em categorias ativas aparecem. A listagem padrão inclui disponíveis e reservadas. Vendidas aparecem com o filtro `status=sold` ou `status=all` e continuam acessíveis pelo link individual, sem chamada de interesse comercial.
- Filtros de texto, marca, categoria, ano, preço, cilindrada, status e destaque são combinados no banco. A ordenação e a paginação também são feitas no banco. Os parâmetros permanecem na URL.
- As opções de marca e ano são obtidas de anúncios publicados; as categorias vêm das categorias ativas. Capa, galeria e características são carregadas do banco, com imagens servidas pela rota pública protegida do R2.
- A página inicial consulta destaques, anúncios recentes e categorias. O detalhe pode sugerir motos publicadas semelhantes por categoria ou marca.
- As respostas das páginas e APIs de catálogo usam `Cache-Control: no-store` para que alterações de publicação apareçam na próxima requisição. Uma imagem já carregada pode permanecer no cache do navegador por até uma hora; a listagem deixa de referenciá-la assim que o anúncio sai do ar.

## Estados de interface

- Banco ausente ou falha de consulta: mensagem de indisponibilidade e HTTP 503, sem exibir motos fictícias como se fossem estoque real.
- Filtro inválido: mensagem de correção e HTTP 400.
- Catálogo vazio: mensagem de que a loja ainda não publicou motos.
- Busca sem resultados ou página fora do intervalo: orientação para ajustar filtros ou voltar à primeira página.
- Slug inexistente ou anúncio despublicado: HTTP 404 no detalhe.
- Navegação entre filtros: indicador visual de carregamento.

## Verificação

```sh
npm run catalog:smoke
npm run typecheck
npm run lint
npm run build
```

`catalog:smoke` aplica as migrations em PostgreSQL isolado e verifica filtros, paginação, detalhes, opções, semelhantes e atualização após despublicação. O Neon real já está conectado e migrou sem erros, mas a validação de anúncios e fotos em serviços reais continua pendente até a criação de um administrador, o cadastro de uma moto e a configuração do R2 de produção.
