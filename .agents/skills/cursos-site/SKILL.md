---
name: cursos-site
description: "Mantém o site das aulas do M16 (Concorrência) publicado no GitHub Pages a partir deste repositório: registra cursos em cursos.json, registra aulas, lista materiais para baixar, ajusta o estilo do site com as regras de contraste, mostra a prévia local e publica com commit e push quando o professor pedir. Use sempre que o pedido envolver o site, a página de um curso, senhas, materiais para os alunos, prévia, publicação, commit ou push deste projeto."
---

# Site dos cursos

Este projeto é o repositório público https://github.com/rmnicola/inteli-m16-concorrencia. Cada push em `main` publica https://rmnicola.github.io/inteli-m16-concorrencia/ pelo workflow `.github/workflows/pages.yml`, que verifica o contraste e roda `tools/gerar_site.py`.

O site tem um curso, `concorrencia`, organizado em aulas: a página do curso, em `/concorrencia/`, lista as aulas, e cada aula tem a própria página, em `/concorrencia/<aula>/`. Tudo aberto, sem senha.

## Regra principal: discutir antes de publicar

Commit e push publicam. Trabalhe localmente, mostre a prévia e só faça commit/push quando o professor pedir. Na dúvida, pergunte.

```sh
python3 tools/gerar_site.py --previa     # inclui rascunhos; serve em http://localhost:8000
```

Rode a prévia em segundo plano, sempre na porta 8000. Se a porta estiver ocupada por outra prévia (deste ou de outro projeto), derrube o processo (`ss -ltnp | grep :8000`, depois `kill <pid>`) em vez de trocar de porta; o professor avisa quando quiser outra porta. Nunca rode dois servidores deste projeto ao mesmo tempo: os dois disputam `_site/`.

## Onde fica cada coisa

| Caminho | Papel |
|---|---|
| `cursos.json` | fonte única do site: dados gerais e lista de cursos |
| `concorrencia/<aula>/apresentacao/` | `deck.html` (fonte) e `dist/index.html` (build publicado). Um deck por aula, atualizado no lugar |
| `concorrencia/<aula>/…` | materiais da aula (PDFs, roteiros); o caminho em `cursos.json` é relativo a `concorrencia/` |
| `site/estilo.css`, `site/DESIGN.md` | design system das páginas: tokens, componentes, regras de contraste |
| `tools/gerar_site.py` | gera `_site/`: índice, página de cada curso, preparação, tela de senha |
| `tools/verificar_contraste.py` | regras C1–C4 e T1; falha bloqueia a publicação |

## Sem versões lado a lado

Não crie pastas datadas nem cópias de decks ou materiais para guardar versões. O curso tem um deck só, que é atualizado; uma versão antiga se recupera num commit antigo (`git log -- concorrencia/<aula>/apresentacao/deck.html`, `git show <commit>:<caminho>`).

## Registrar um curso

Em `cursos.json`, cada curso tem:

| Campo | Uso |
|---|---|
| `slug` | URL: `/<slug>/`. Não mude depois de divulgado |
| `pasta` | pasta do curso na raiz do repositório. Curso sem `pasta` aparece como "em breve" |
| `senha_sha256` | opcional, hash da senha do curso (veja "Senhas"); hoje nenhum curso usa |
| `oculto` | `true`: fora do índice, com `noindex` em todas as páginas. Só quem tem o link chega |
| `rascunho` | `true` enquanto estiver em andamento: fica fora do site publicado, aparece na prévia |
| `titulo`, `subtitulo` | textos do índice e da página |
| `proposito`, `objetivos` | frase de propósito e objetivos de aprendizagem (aceitam `código`, **forte**, *ênfase*) |
| `apresentacao` | arquivo relativo à pasta, normalmente `apresentacao/dist/index.html`; vira `apresentacao.html` |
| `instituicao` | opcional: troca o nome da instituição do site ("Inteli") nas páginas do curso |
| `aulas` | em vez de `apresentacao` e `materiais` no curso: lista de aulas, cada uma com `slug`, `titulo`, `subtitulo` (opcional), `apresentacao` e `materiais`, ou com `"em_breve": true`, que só anuncia a aula. A página do curso vira o índice das aulas, como o índice do site, e cada aula publicada ganha a própria página em `/<slug>/<aula>/` (é o caso de `concorrencia`) |
| `materiais` | lista de `{rotulo, tipo, arquivo}` (arquivo da pasta, baixado) ou `{rotulo, tipo, link}` |

Um `preparacao.json` na pasta do curso vira `/<slug>/preparacao/`, e cada `<pasta>/guias/<nome>.json` vira `/<slug>/<nome>/`: um passo a passo com comandos, código e prompts copiáveis, no mesmo formato do projeto `pecege-ons`. Cada passo aceita `titulo`, `texto` (lista; dois ou mais itens viram lista), `comandos` (terminal), `codigo` com `arquivo` (o título da barra, como o nome do arquivo ou "Prompt"), `saida` com `saida_titulo`, `tabela` (`titulo`, `cabecalho` e `linhas`: uma tabela HTML que não quebra as colunas, para gabaritos), `depois` e `aviso`; o guia aceita ainda `resumo`, `contexto` e `problemas` (pares sintoma e solução). Os textos aceitam `código`, **forte**, *ênfase* e [link](endereço). Um guia com `variantes` (`[{"id", "rotulo"}]`, por exemplo um aplicativo por variante) ganha um seletor ao lado do título, como as abas do Starlight: cada passo troca o que estiver em `"variantes": {id: {campos}}`, `{app}` em qualquer texto vira o rótulo da variante, e um problema com um terceiro item (o id) só aparece naquela variante. O link `<nome>/?app=<id>` abre já numa variante (exemplo em `../exec-inteli-ai-for-business/ferramentas-em-acao/guias/conectar-mcp.json`). Para o guia aparecer na página do curso, acrescente-o aos `materiais` com `"link": "<nome>/"` e um `tipo` como "passo a passo" ou "roteiro".

O CI não roda o build dos decks (precisa de Chromium): `dist/index.html` precisa estar atualizado e commitado.

## Senhas

Os cursos ficam sem senha, por decisão do professor (19/10/2026). Não ponha senha em nenhum curso sem ele pedir. O mecanismo continua no gerador: curso com `senha_sha256` ganha a tela de senha.

Só o hash SHA-256 fica em `cursos.json`. Nunca escreva uma senha em texto em nenhum arquivo do repositório, que é público: pergunte ao professor quando precisar dela. A comparação ignora maiúsculas e espaços nas pontas, então gere o hash da senha em minúsculas:

```sh
printf %s '<senha>' | sha256sum
```

Cada curso guarda a liberação no navegador pela chave do próprio hash: entrar num curso não libera os outros.

A tela é uma barreira visual: o repositório e os links diretos dos arquivos continuam públicos. Diga isso ao professor sempre que o assunto for privacidade.

## Estilo do site

Minimalista e monoespaçado, o mesmo dos sites `inteli-exec` e `pecege-ons`. Leia `site/DESIGN.md` antes de mexer. Toda cor nova vira token em `site/estilo.css`, ganha um par em `PARES` no verificador e deve passar em:

```sh
python3 tools/verificar_contraste.py
```

Confira as páginas na prévia em 1280px e 390px. Para capturar uma página atrás da senha, digite a senha no campo `#portao-senha` antes da captura.

## Publicar (somente quando o professor pedir)

1. Retire `"rascunho"` do curso, se for o caso, e confira a prévia.
2. `python3 tools/verificar_contraste.py` e `python3 tools/gerar_site.py` sem erros.
3. `git status`: confirme que nada privado entra (`ref-enade/`, a skill `lbl`, `.opencode/`, dados de turma, `.docx`, `.pptx`, `.xlsx`, `qa/` e PDFs de `dist/` são ignorados). Use `git add` com caminhos explícitos quando houver alterações fora do escopo.
4. Commit em português, descrevendo o que muda para quem usa o site, com a linha de coautoria da sessão. Autor: Rodrigo Nicola.
5. `git push origin main` e confira o workflow (API pública: `https://api.github.com/repos/rmnicola/inteli-m16-concorrencia/actions/runs`).
