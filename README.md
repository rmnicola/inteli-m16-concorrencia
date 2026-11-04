# Inteli · M16 Concorrência

Apresentações, roteiros e referências das aulas de concorrência de Rodrigo Nicola, no módulo 16 da graduação do Inteli.

**Site:** https://rmnicola.github.io/inteli-m16-concorrencia/, publicado automaticamente a cada push em `main`.

## Estrutura

```
curso.json                   fonte única do site: o curso e a lista de aulas
<aula>/
  apresentacao/              deck.html (fonte) e dist/index.html (build publicado)
  guias/                     passo a passo e roteiros (opcional)
site/                        estilo das páginas do site (ver site/DESIGN.md)
tools/gerar_site.py          gera _site/ a partir de curso.json
```

## Fluxo

1. Gere o deck: `node .design-system/tools/deck.mjs <aula>/apresentacao/deck.html`
2. Registre a aula em `curso.json` (`"rascunho": true` enquanto estiver em andamento; `"em_breve": true` se ainda não tem material).
3. Prévia: `python3 tools/gerar_site.py --previa` e abra http://localhost:8000
4. Publicar: commit e push em `main`.

`.design-system` é um link para o design system compartilhado, fora do repositório: o CI não gera os decks, então o
`dist/index.html` de cada aula vai commitado.
