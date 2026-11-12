# Verificação do front-end

Verificações locais executadas em 21/10/2026 com Chromium via Playwright; versão do navegador e resultados no [JSON](./evidencias/resultado.json). As capturas em `evidencias/` documentam home, login, formulário e resultados em 360 e 1280 px. As capturas são evidência da interface; os wireframes ficam em pasta própria.

## Reproduzir

Na pasta `desenvolvimento-web/`:

```sh
python testes/validar.py
node --check src/js/app.js
npm install --no-save playwright
npx playwright install chromium
node testes/fluxos.cjs
```

O teste abre um servidor local temporário e fecha ao concluir. Playwright foi usado somente para verificação, sem dependências de produção. A execução local original usou Playwright 1.62.1.

Cobertura: 12 páginas em duas larguras, ausência de overflow da página, rótulos e alt, recursos sem erro HTTP, console sem erros de JavaScript, login inválido/válido sem credenciais na URL, datas, duplicidade, alternativas, seleção de perguntas, código fictício, campos obrigatórios, avanço/retorno preservando escolhas, conclusão única, filtros e geração fictícia. Também se verifica ausência de armazenamento local e desativação do envio sem JavaScript.

O validador Python confere links e recursos locais do HTML, unicidade de IDs, rótulos, semântica, alt e XML dos wireframes. A publicação nativa do GitHub Pages lê a branch gh-pages, gerada exclusivamente a partir de src. O histórico de deployments no GitHub registra a publicação; a URL pública é verificada após o deploy. Para atualizar, valide localmente e execute a partir da raiz do repositório: git subtree split --prefix=2026-2/desenvolvimento-web/src; publique o SHA retornado com git push origin SHA:gh-pages.

Não são testes de backend, autenticação ou garantias de anonimato. Inspeção de acessibilidade básica e contraste das cores principais não equivale a auditoria completa WCAG.
