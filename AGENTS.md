# Inteli · M16 Concorrência

Aulas de Rodrigo Nicola sobre concorrência, no módulo 16 da graduação do Inteli. Os decks usam a identidade **Inteli** (logo inteli, capa triangular, sem tela de pesquisa), nunca a Exec.

O repositório segue o esquema do `inteli-exec` (`../exec-inteli-ai-for-business`): `cursos.json` é a fonte única do site, e o curso `concorrencia/` é organizado em aulas. Cada aula tem pasta própria, `concorrencia/<aula>/`, com um deck só em `apresentacao/`, atualizado no lugar: não crie pastas datadas nem cópias para guardar versões. Uma versão antiga se recupera num commit antigo.

Para criar, editar ou revisar apresentações, leia e siga `.agents/skills/apresentacao-inteli/SKILL.md` e `design-system/README.md`. Na capa, o título é `M16 - <tema>` e o autor, `Prof. Nicola`.

Este projeto é o repositório público github.com/rmnicola/inteli-m16-concorrencia; cada push em `main` publica o site (https://rmnicola.github.io/inteli-m16-concorrencia/). Para o site, a prévia e a publicação, leia `.agents/skills/cursos-site/SKILL.md`. Mostre a prévia e só faça commit/push quando o professor pedir. Nunca adicione arquivos privados listados no `.gitignore` (`ref-enade/`, a skill `lbl`, `.opencode/`, dados de turma).

As skills ficam em `.agents/skills/`, lidas por Codex, OpenCode e Gemini; `.claude/skills` é um link para essa pasta, e `CLAUDE.md` e `GEMINI.md` são links para este arquivo. `design-system/` e `.agents/skills/apresentacao-inteli` são links para `../compartilhado/` (ver `../compartilhado/README.md`).
