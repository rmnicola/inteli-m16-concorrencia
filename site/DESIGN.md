# Design system — páginas dos cursos

Minimalista e monoespaçado, inspirado na simplicidade de opencode.ai. Uma coluna central emoldurada por linhas finas; seções separadas por divisórias de 1px; nada de sombras, gradientes ou ícones decorativos.

## Tokens (`estilo.css`, `:root`)

| Grupo | Tokens | Uso |
|---|---|---|
| Fundo | `--fundo`, `--fundo-fraco`, `--fundo-fraco-hover`, `--fundo-forte`, `--fundo-forte-hover` | página; hover de listas; cartão da apresentação e seu hover |
| Texto | `--texto`, `--texto-fraco`, `--texto-forte`, `--texto-invertido`, `--texto-invertido-fraco` | corpo; rótulos e datas; títulos e links; texto sobre `--fundo-forte` |
| Linhas | `--borda`, `--borda-fraca` | contorno de cartão e campo (≥ 3:1); divisórias decorativas e moldura |
| Cor | `--destaque`, `--selecao` | acento raro; seleção de texto |
| Tipo | `--fonte` (IBM Plex Mono), `--t-pequeno`, `--t-base`, `--t-titulo`, `--entrelinha` (2) | uma família, três tamanhos, pesos 400/500 |
| Código | `--codigo-*`, `--sx-*` | blocos de terminal estilo Starlight, realce de shell; `--codigo-controle` é o contorno do botão copiar |
| Espaço | `--largura` (60rem), `--respiro-x`, `--respiro-y`, `--raio` (4px) | coluna, margens internas das seções |

Modo escuro automático por `prefers-color-scheme`; `data-tema="claro"` no `<html>` força o claro.

## Componentes

- `.moldura` — coluna central com bordas laterais.
- `.topo` — marca à esquerda, navegação em texto à direita.
- `.secao` — bloco com respiro e divisória superior.
- `.rotulo` — metadado pequeno e esmaecido (data, instituição, tipo de arquivo).
- `.aulas` / `.aula` — lista em linhas: data · título e subtítulo · estado. Com `.cursos` (índice do site), sem a coluna de data.
- `.cartao` — a ação principal da página (a apresentação): bloco escuro preenchido, título grande, seta que avança ao passar o cursor.
- `.objetivos` — objetivos de aprendizagem como lista discreta dentro da introdução, sem título próprio.
- `.arquivos` — lista de downloads com tipo à direita.
- `.codigo.terminal` — bloco de terminal no estilo Starlight: três pontos e botão de copiar na barra, realce de shell; `.codigo.saida` mostra a saída esperada.
- `.etapas` — passo a passo no padrão Steps do Starlight: círculos numerados ligados por uma linha guia.
- `.problemas` — sintoma em cima, solução embaixo, um por linha.
- `.rodape` — créditos e avisos em texto pequeno.

## Regras

- Um só cartão por página: a ação principal.
- Links sublinhados com 1px; sem botões coloridos.
- Links do conteúdo do curso (apresentação, materiais, GitHub) abrem em outra aba; a navegação entre páginas do site, na mesma.
- Títulos em peso 500, nunca negrito pesado.
- Texto corrido com entrelinha 2.

## Contraste e legibilidade

Regras verificadas por `python tools/verificar_contraste.py`, que roda também no workflow antes de publicar: se uma regra falhar, o site não é publicado. Valem para os dois temas, com cores transparentes compostas sobre o fundo real.

| Regra | Mínimo | Onde | Base |
|---|---|---|---|
| C1 · texto principal | 7:1 | corpo, títulos, links, texto em cartões | WCAG 2.2, 1.4.6 (AAA) |
| C2 · texto secundário | 4.5:1 | rótulos, datas, estados, erros, balões | WCAG 2.2, 1.4.3 (AA) |
| C3 · código | 4.5:1 | texto e cada cor de realce sobre o fundo do bloco, código em linha, título da barra | WCAG 2.2, 1.4.3 |
| C4 · componentes | 3:1 | contorno de campos, cartões e botões, ícones, anel de foco, barra do aviso | WCAG 2.2, 1.4.11 |
| T1 · tamanho | 13px | nenhum texto menor; `em` só com piso `max(…, var(--t-pequeno))` | heurística de legibilidade em telas |

Heurísticas complementares, aplicadas na revisão:

- **Cor nunca é o único sinal.** Links são sublinhados; estados têm texto ("abrir →", "rascunho →", "[OK]"); erro tem mensagem.
- **Divisórias decorativas** (`--borda-fraca`) podem ser sutis porque não carregam informação. Se uma linha delimita algo clicável ou um campo, use `--borda`.
- **Estados com cursor** (hover) mantêm os mínimos: o verificador testa texto sobre `--fundo-fraco-hover`.
- **Toda cor nova** entra como token e ganha um par em `PARES` no verificador antes de ser usada.
