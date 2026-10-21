---
name: cursos-site
description: "Mantém o site das aulas do M16 (Concorrência) publicado no GitHub Pages a partir deste repositório: registra aulas em curso.json com a apresentação, os roteiros e as referências de cada uma, ajusta o estilo do site com as regras de contraste, mostra a prévia local e publica com commit e push quando o professor pedir. Use sempre que o pedido envolver o site, a página de uma aula, senhas, roteiros e referências para os alunos, prévia, publicação, commit ou push deste projeto."
---

# Site das aulas

Este projeto é o repositório público https://github.com/rmnicola/inteli-m16-concorrencia. Cada push em `main` publica https://rmnicola.github.io/inteli-m16-concorrencia/ pelo workflow `.github/workflows/pages.yml`, que verifica o contraste e roda `tools/gerar_site.py`.

O site segue o esquema do `pecege-ons`: um curso só. A página inicial já é a lista das aulas, e cada aula tem a própria página, em `/aulas/<slug>/`, com a apresentação, os roteiros e as referências. Tudo aberto, sem senha.

## Regra principal: discutir antes de publicar

Commit e push publicam. Trabalhe localmente, mostre a prévia e só faça commit/push quando o professor pedir. Na dúvida, pergunte.

```sh
python3 tools/gerar_site.py --previa     # inclui rascunhos; serve em http://localhost:8000
```

Rode a prévia em segundo plano, sempre na porta 8000. Se a porta estiver ocupada por outra prévia (deste ou de outro projeto), derrube o processo (`ss -ltnp | grep :8000`, depois `kill <pid>`) em vez de trocar de porta; o professor avisa quando quiser outra porta. Nunca rode dois servidores deste projeto ao mesmo tempo: os dois disputam `_site/`.

## Onde fica cada coisa

| Caminho | Papel |
|---|---|
| `curso.json` | fonte única do site: dados do curso e lista de aulas |
| `aulas/<aula>/apresentacao/` | `deck.html` (fonte) e `dist/index.html` (build publicado). Um deck por aula, atualizado no lugar |
| `aulas/<aula>/…` | arquivos da aula (PDFs, código); os caminhos em `curso.json` são relativos à pasta da aula |
| `aulas/<aula>/guias/<nome>.json` | passo a passo ou roteiro da aula, publicado em `/aulas/<aula>/<nome>/` |
| `site/estilo.css`, `site/DESIGN.md` | design system das páginas: tokens, componentes, regras de contraste |
| `tools/gerar_site.py` | gera `_site/`: índice das aulas, página de cada aula, guias, tela de senha |
| `tools/verificar_contraste.py` | regras C1–C4 e T1; falha bloqueia a publicação |

## Sem versões lado a lado

Não crie pastas datadas nem cópias de decks ou materiais para guardar versões. Cada aula tem um deck só, que é atualizado; uma versão antiga se recupera num commit antigo (`git log -- aulas/<aula>/apresentacao/deck.html`, `git show <commit>:<caminho>`).

## Registrar uma aula

`curso.json` tem `titulo`, `subtitulo` (opcional), `instituicao` ("Inteli"), `professor`, `descricao`, `repositorio`, `senha_sha256` (opcional, veja "Senhas") e a lista `aulas`, na ordem em que acontecem. Cada aula tem:

| Campo | Uso |
|---|---|
| `slug` | URL: `/aulas/<slug>/`. Não mude depois de divulgado |
| `pasta` | pasta da aula, normalmente `aulas/<slug>` |
| `titulo`, `subtitulo` | textos do índice e da página da aula |
| `data`, `horario` | opcionais. Com `data` (AAAA-MM-DD), a lista mostra a data; sem ela, "Aula N" |
| `proposito`, `objetivos` | opcionais: frase de propósito e objetivos de aprendizagem (aceitam `código`, **forte**, *ênfase*) |
| `apresentacao` | arquivo relativo à pasta, normalmente `apresentacao/dist/index.html`; vira `apresentacao.html` |
| `roteiros` | o que a turma faz: setup, roteiros, passo a passo. Lista de `{rotulo, tipo, link}` (um guia, `"link": "<nome>/"`) ou `{rotulo, tipo, arquivo}` (arquivo da pasta, baixado) |
| `referencias` | material de consulta: capítulos do livro, repositórios de código. Mesmo formato, normalmente com `link` externo |
| `em_breve` | `true`: só anuncia a aula no índice, sem página |
| `rascunho` | `true` enquanto estiver em andamento: fica fora do site publicado, aparece na prévia |

Cada `<pasta>/guias/<nome>.json` vira `/aulas/<slug>/<nome>/`: um passo a passo com comandos, código e prompts copiáveis, no mesmo formato do projeto `pecege-ons`. Cada passo aceita `titulo`, `texto` (lista; dois ou mais itens viram lista), `comandos` (terminal), `codigo` com `arquivo` (o título da barra, como o nome do arquivo ou "Prompt"), `saida` com `saida_titulo`, `tabela` (`titulo`, `cabecalho` e `linhas`: uma tabela HTML que não quebra as colunas, para gabaritos), `depois` e `aviso`; o guia aceita ainda `resumo`, `contexto` e `problemas` (pares sintoma e solução). Os textos aceitam `código`, **forte**, *ênfase* e [link](endereço). Um guia com `variantes` (`[{"id", "rotulo"}]`, por exemplo um sistema operacional por variante) ganha um seletor ao lado do título, como as abas do Starlight: cada passo troca o que estiver em `"variantes": {id: {campos}}`, `{app}` em qualquer texto vira o rótulo da variante, e um problema com um terceiro item (o id) só aparece naquela variante. O link `<nome>/?app=<id>` abre já numa variante (exemplo em `../exec-inteli-ai-for-business/ferramentas-em-acao/guias/conectar-mcp.json`). Um guia que não entra em `roteiros` existe, mas não aparece no site, como no `pecege-ons`: é o caso do gabarito de cada roteiro (`guias/gabarito.json` → `/aulas/<slug>/gabarito/`), para o professor. Marque-o com `"oculto": true`, que pede aos buscadores que não o indexem; o repositório continua público. Para o guia aparecer na página da aula, acrescente-o aos `roteiros` com `"link": "<nome>/"` e um `tipo` como "passo a passo" ou "roteiro".

O CI não roda o build dos decks (precisa de Chromium): `dist/index.html` precisa estar atualizado e commitado.

## Senhas

O site fica sem senha. Não ponha senha sem o professor pedir. O mecanismo continua no gerador: com `senha_sha256` em `curso.json`, todas as páginas ganham a tela de senha.

Só o hash SHA-256 fica em `curso.json`. Nunca escreva uma senha em texto em nenhum arquivo do repositório, que é público: pergunte ao professor quando precisar dela. A comparação ignora maiúsculas e espaços nas pontas, então gere o hash da senha em minúsculas:

```sh
printf %s '<senha>' | sha256sum
```

A tela é uma barreira visual: o repositório e os links diretos dos arquivos continuam públicos. Diga isso ao professor sempre que o assunto for privacidade.

## Estilo do site

Minimalista e monoespaçado, o mesmo dos sites `inteli-exec` e `pecege-ons`. Leia `site/DESIGN.md` antes de mexer. Toda cor nova vira token em `site/estilo.css`, ganha um par em `PARES` no verificador e deve passar em:

```sh
python3 tools/verificar_contraste.py
```

Confira as páginas na prévia em 1280px e 390px. Para capturar uma página atrás da senha, digite a senha no campo `#portao-senha` antes da captura.

## Publicar (somente quando o professor pedir)

1. Retire `"rascunho"` da aula, se for o caso, e confira a prévia.
2. `python3 tools/verificar_contraste.py` e `python3 tools/gerar_site.py` sem erros.
3. `git status`: confirme que nada privado entra (`ref-enade/`, a skill `lbl`, `.opencode/`, dados de turma, `.docx`, `.pptx`, `.xlsx`, `qa/` e PDFs de `dist/` são ignorados). Use `git add` com caminhos explícitos quando houver alterações fora do escopo.
4. Commit em português, descrevendo o que muda para quem usa o site, com a linha de coautoria da sessão. Autor: Rodrigo Nicola.
5. `git push origin main` e confira o workflow (API pública: `https://api.github.com/repos/rmnicola/inteli-m16-concorrencia/actions/runs`).
