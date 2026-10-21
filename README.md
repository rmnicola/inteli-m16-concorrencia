# Inteli · M16 Concorrência

Apresentações e materiais das aulas de concorrência de Rodrigo Nicola, no módulo 16 da graduação do Inteli.

**Site:** https://rmnicola.github.io/inteli-m16-concorrencia/, publicado automaticamente a cada push em `main`.

## Estrutura

```
cursos.json                              fonte única do site: curso, aulas e materiais
concorrencia/                            o curso, em aulas
  introducao-a-concorrencia/
    apresentacao/                        deck.html (fonte) e dist/index.html (build publicado)
design-system/                           identidade Inteli dos slides (link para ../compartilhado)
site/                                    design system das páginas do site (ver site/DESIGN.md)
tools/gerar_site.py                      gera _site/ a partir de cursos.json
.agents/skills/                          skills; .claude/skills é link para cá
```

## Fluxo de trabalho

1. Edite o deck da aula e gere o build:
   `node design-system/tools/deck.mjs concorrencia/introducao-a-concorrencia/apresentacao/deck.html`
2. Registre a aula em `cursos.json`, na lista `aulas` do curso. Uma aula que ainda não tem material leva `"em_breve": true`.
3. Veja a prévia local: `python3 tools/gerar_site.py --previa` e abra http://localhost:8000
4. Para publicar, faça commit e push em `main`.

O `design-system/` é um symlink para `../compartilhado/design-systems/inteli`: o repositório precisa ficar em `Disciplinas/`, ao lado de `compartilhado/`. O CI não gera os decks, então o `dist/index.html` de cada aula vai commitado.

## Fora do repositório

Ficam só na máquina do professor (ver `.gitignore`): as questões do ENADE (`ref-enade/`), a skill `lbl`, a configuração do OpenCode e qualquer dado de turma.
