# Portefólio (GitHub Pages)

Este pacote contém um site estático com pesquisa/filtragem a partir de **data.json**.

## Ficheiros
- `index.html` — página inicial com pesquisa e grelha de cartões
- `styles.css` — estilos
- `app.js` — lógica de pesquisa/filtragem e overlay de detalhe
- `data.json` — conteúdo (gerado a partir do Excel)
- `.nojekyll` — impede processamento por Jekyll

## Publicar no GitHub Pages
1. Crie um repositório público no GitHub (por exemplo, `portfolio`).
2. Faça upload destes ficheiros para a **raiz** do repositório.
3. Vá a **Settings → Pages** e, em **Build and deployment → Source**, escolha **Deploy from a branch**. Selecione a branch (ex.: `main`) e a pasta **/ (root)**.
4. Guarde. O site ficará acessível em `https://<utilizador>.github.io/<repositorio>/` em alguns segundos.

Para atualizar o conteúdo, edite o `data.json` e volte a fazer commit.
