# Sitemap e wireframes

Arquitetura extraída do ZIP enviado pelo usuário e atualizada em 21/10/2026. Wireframes de baixa fidelidade documentados a partir das telas recebidas, sem alegar prototipação anterior.

```text
index.html — Home / Institucional
├── login.html — acesso e cadastro demonstrativos
└── main.html — painel de navegação
    ├── paginas/categoria.html
    ├── paginas/pesquisa.html
    ├── paginas/perguntas.html
    ├── paginas/questionario.html
    ├── paginas/senhas.html
    ├── paginas/solicitar-senha.html
    ├── paginas/responder.html — código → experiência → recomendação → comentário
    ├── paginas/monitoramento.html
    └── paginas/relatorios.html
```

Todas as páginas compartilham cabeçalho, navegação, rodapé e CSS. O painel dá acesso às nove funções; páginas internas retornam ao painel. O login apenas demonstra navegação e não controla acesso real.

- [Home](./home.svg)
- [Login / acesso](./login.svg)
- [Formulário de pesquisa](./formulario.svg)
- [Painel de resultados](./resultados.svg)

[Abrir protótipo](../src/index.html) · [Voltar à disciplina](../README.md)
