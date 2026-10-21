#!/usr/bin/env python3
"""Gera o site estático do curso a partir de curso.json, no esquema do site pecege-ons.

Saída em _site/: index.html com a lista de aulas e, para cada aula publicável,
aulas/<slug>/ com a página da aula (apresentação e recursos), a apresentação
(copiada de <pasta>/<apresentacao>), os arquivos dos recursos e uma página de
passo a passo para cada <pasta>/guias/<nome>.json (em aulas/<slug>/<nome>/).
Aulas com "rascunho": true ficam fora do site publicado; com "em_breve": true,
só aparecem anunciadas no índice. Com senha_sha256 no curso, as páginas ganham
uma tela de senha.

    python tools/gerar_site.py            # gera _site/ como será publicado
    python tools/gerar_site.py --previa   # inclui rascunhos e serve em http://localhost:8000
"""

from __future__ import annotations

import argparse
import http.server
import json
import re
import shutil
from functools import partial
from datetime import date
from html import escape
from pathlib import Path

from verificar_contraste import temas

RAIZ = Path(__file__).resolve().parents[1]
PREVIA = False  # --previa: inclui rascunhos
SAIDA = RAIZ / "_site"
MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
# Links do conteúdo da aula abrem em outra aba; a navegação entre páginas do site, não.
NOVA_ABA = ' target="_blank" rel="noopener"'
FONTES = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
          '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
          '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">')
COPIAR = """<script>
document.querySelectorAll('.copiar').forEach(b => b.addEventListener('click', () => {
  const texto = b.closest('.codigo').querySelector('code').innerText;
  navigator.clipboard.writeText(texto).then(() => {
    b.classList.add('copiado'); setTimeout(() => b.classList.remove('copiado'), 1600);
  });
}));
</script>"""
ICONE_COPIAR = ('<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" '
                'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/>'
                '<path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>')
TOKEN_SHELL = re.compile(r"""(?P<esp>\s+)|(?P<com>\#.*$)|(?P<str>"(?:[^"\\]|\\.)*"|'[^']*')"""
                         r"""|(?P<var>\$\([^)]*\)|\$\{?\w+\}?)|(?P<op>&&|\|\||2>|[|;>])|(?P<pal>[^\s"'|;>&$]+)|(?P<outro>.)""")
PREFIXOS = {"sudo"}


# Tela de senha: apenas reduz a exposição casual. O conteúdo continua
# acessível pelo repositório público e pelos links diretos dos arquivos.
PORTAO = """<div id="portao" role="dialog" aria-modal="true" aria-labelledby="portao-titulo">
<style>
#portao { __VARS__ position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center;
  background: var(--p-fundo); color: var(--p-texto); font: 400 16px/1.8 "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace; }
@media (prefers-color-scheme: dark) { #portao { __VARS_ESCURO__ } }
#portao form { width: min(22rem, calc(100vw - 3rem)); display: flex; flex-direction: column; gap: 0.75rem; }
#portao h1 { margin: 0; font: 500 1.25rem/1.5 inherit; color: var(--p-forte); }
#portao label { font-size: 15px; }
#portao input { font: inherit; padding: 0.5rem 0.75rem; border: 1px solid var(--p-borda); border-radius: 4px; background: var(--p-fundo); color: var(--p-forte); }
#portao button { align-self: flex-start; font: inherit; padding: 0.25rem 0; border: 0; background: none; color: var(--p-forte); text-decoration: underline; text-underline-offset: 4px; cursor: pointer; }
#portao input:focus-visible, #portao button:focus-visible { outline: 2px solid var(--p-forte); outline-offset: 2px; }
#portao .erro { min-height: 1.8em; margin: 0; font-size: 15px; color: var(--p-erro); }
html.liberado #portao { display: none; }
</style>
<form>
<h1 id="portao-titulo">Material do curso</h1>
<label for="portao-senha">Senha informada pelo professor</label>
<input id="portao-senha" type="password" autocomplete="current-password" required>
<button type="submit">entrar →</button>
<p class="erro" aria-live="polite"></p>
</form>
<script>
(() => {
  const ALVO = "__HASH__", CHAVE = "acesso-" + ALVO.slice(0, 8);
  const raiz = document.documentElement, portao = document.getElementById("portao");
  const ler = () => { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } };
  const liberar = () => { raiz.classList.add("liberado"); document.removeEventListener("keydown", bloquear, true); };
  const bloquear = ev => { if (!portao.contains(ev.target)) ev.stopImmediatePropagation(); };
  if (ler() === ALVO) { liberar(); return; }
  document.addEventListener("keydown", bloquear, true);
  const campo = document.getElementById("portao-senha");
  setTimeout(() => campo.focus(), 0);
  portao.querySelector("form").addEventListener("submit", async ev => {
    ev.preventDefault();
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(campo.value.trim().toLowerCase()));
    const hash = [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");
    if (hash === ALVO) { try { localStorage.setItem(CHAVE, hash); } catch (e) {} liberar(); }
    else { portao.querySelector(".erro").textContent = "Senha incorreta."; campo.select(); }
  });
})();
</script>
</div>"""


def variaveis_portao(cores: dict[str, str]) -> str:
    """Cores da tela de senha vêm dos tokens do site, para seguir as mesmas regras de contraste."""
    mapa = {"--p-fundo": "--fundo", "--p-texto": "--texto", "--p-forte": "--texto-forte",
            "--p-borda": "--borda", "--p-erro": "--destaque"}
    return " ".join(f"{p}: {cores[t]};" for p, t in mapa.items())


def com_portao(html: str, curso: dict) -> str:
    """Põe a tela de senha do curso logo depois de <body>."""
    if not curso.get("senha_sha256"):
        return html
    tema = temas((RAIZ / "site" / "estilo.css").read_text(encoding="utf-8"))
    portao = (PORTAO.replace("__HASH__", curso["senha_sha256"])
              .replace("__VARS__", variaveis_portao(tema["claro"]))
              .replace("__VARS_ESCURO__", variaveis_portao(tema["escuro"])))
    return re.sub(r"(<body[^>]*>)", lambda m: m.group(1) + portao, html, count=1)


def pagina(site: dict, titulo: str, corpo: str, raiz: str) -> str:
    repo = escape(site["repositorio"])
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(titulo)}</title>
<meta name="description" content="{escape(site['descricao'])}">
{FONTES}
<link rel="stylesheet" href="{raiz}estilo.css">
</head>
<body>
<div class="moldura">
<header class="topo"><a class="marca" href="{raiz}">{escape(site['instituicao'])}</a><nav><a href="{raiz}">aulas</a><a href="{repo}"{NOVA_ABA}>github</a></nav></header>
<main>
{corpo}
</main>
<footer class="rodape"><p>{escape(site['professor'])} · {escape(site['instituicao'])}</p></footer>
</div>
{COPIAR}
</body>
</html>
"""


def data_curta(iso: str) -> str:
    d = date.fromisoformat(iso)
    return f"{d.day:02d} {MESES[d.month - 1]} {d.year}"



def inline(texto: str) -> str:
    """Formatação mínima: `código`, **forte**, *ênfase* e [link](endereço)."""
    t = escape(texto)
    t = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', t)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    return re.sub(r"\*([^*]+)\*", r"<em>\1</em>", t)


def realcar_shell(texto: str) -> str:
    """Realce mínimo de shell: comando, prefixo (sudo), opções, textos, variáveis, operadores e comentários."""
    linhas = []
    for linha in texto.split("\n"):
        partes, espera_comando = [], True
        for m in TOKEN_SHELL.finditer(linha):
            tipo, t = m.lastgroup, m.group()
            classe = None
            if tipo == "esp":
                partes.append(t)
                continue
            if tipo == "com":
                classe = "sx-com"
            elif tipo == "str":
                classe = "sx-str"
            elif tipo == "var":
                classe = "sx-var"
            elif tipo == "op":
                classe, espera_comando = "sx-op", t not in (">", "2>")
            elif tipo == "pal":
                if espera_comando:
                    classe = "sx-kw" if t in PREFIXOS else "sx-cmd"
                    espera_comando = t in PREFIXOS
                elif t.startswith("-"):
                    classe = "sx-flag"
                elif re.fullmatch(r"\d+(\.\d+)?", t):
                    classe = "sx-num"
            partes.append(f'<span class="{classe}">{escape(t)}</span>' if classe else escape(t))
        linhas.append("".join(partes))
    return "\n".join(linhas)


def comando(texto: str, titulo: str = "") -> str:
    """Bloco de terminal: três pontos e botão de copiar na barra, título opcional."""
    rotulo = f'<span class="codigo-titulo">{escape(titulo)}</span>' if titulo else ""
    return (f'<figure class="codigo terminal"><figcaption class="codigo-barra"><span class="pontos" aria-hidden="true"></span>'
            f'{rotulo}<button class="copiar" type="button" aria-label="Copiar comandos" title="Copiar">{ICONE_COPIAR}</button>'
            f'</figcaption><pre><code>{realcar_shell(texto)}</code></pre></figure>')


def codigo(texto: str, arquivo: str) -> str:
    """Bloco de código ou de prompt com o arquivo na barra; comentários e "..." (o que já está no arquivo) esmaecidos."""
    if arquivo == "Prompt":  # num prompt, "#" é título em Markdown, não comentário
        linhas = escape(texto)
    else:
        linhas = "\n".join(f'<span class="sx-com">{escape(l)}</span>' if l.strip() == "..." or l.lstrip().startswith("#") else escape(l)
                           for l in texto.split("\n"))
    return (f'<figure class="codigo"><figcaption class="codigo-barra"><span class="codigo-titulo">{escape(arquivo)}</span>'
            f'<button class="copiar" type="button" aria-label="Copiar código" title="Copiar">{ICONE_COPIAR}</button>'
            f'</figcaption><pre><code>{linhas}</code></pre></figure>')


def saida(texto: str, titulo: str = "Saída esperada") -> str:
    corpo = re.sub(r"\[OK\]", '<span class="sx-ok">[OK]</span>', escape(texto))
    return (f'<figure class="codigo saida"><figcaption class="codigo-barra"><span class="codigo-titulo">{escape(titulo)}</span>'
            f'</figcaption><pre><code>{corpo}</code></pre></figure>')



def tabela(dados: dict) -> str:
    """Tabela de referência (um gabarito, por exemplo), com título na barra, como os blocos de saída."""
    cab = "".join(f"<th>{inline(c)}</th>" for c in dados["cabecalho"])
    linhas = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in l) + "</tr>" for l in dados["linhas"])
    return (f'<figure class="codigo tabela"><figcaption class="codigo-barra"><span class="codigo-titulo">{escape(dados.get("titulo", ""))}</span>'
            f'</figcaption><div class="rolagem"><table><thead><tr>{cab}</tr></thead><tbody>{linhas}</tbody></table></div></figure>')



def publicavel(aula: dict) -> bool:
    return bool(aula.get("pasta")) and not aula.get("em_breve") and (PREVIA or not aula.get("rascunho"))


def marcador(n: int, aula: dict) -> str:
    """Coluna da esquerda da lista: a data, quando a aula tem uma; senão, o número."""
    return data_curta(aula["data"]) if aula.get("data") else f"Aula {n}"


def gerar_indice(curso: dict) -> str:
    itens = []
    for n, aula in enumerate(curso["aulas"], 1):
        sub = f'<span class="sub">{escape(aula["subtitulo"])}</span>' if aula.get("subtitulo") else ""
        miolo = f'<span class="data">{marcador(n, aula)}</span><span><h3>{escape(aula["titulo"])}</h3>{sub}</span>'
        if publicavel(aula):
            estado = "rascunho →" if aula.get("rascunho") else "abrir →"
            itens.append(f'<li class="aula"><a href="aulas/{escape(aula["slug"])}/">{miolo}<span class="estado">{estado}</span></a></li>')
        else:
            itens.append(f'<li class="aula"><div>{miolo}<span class="estado">em breve</span></div></li>')
    corpo = f"""<section class="secao">
<p class="rotulo">{escape(curso['instituicao'])} · {escape(curso['professor'])}</p>
<h1>{escape(curso['titulo'])}</h1>
{f"<p>{escape(curso['subtitulo'])}</p>" if curso.get('subtitulo') else ''}
<p>{escape(curso['descricao'])}</p>
</section>
<section class="secao">
<h2>Aulas</h2>
<ul class="aulas">
{chr(10).join(itens)}
</ul>
</section>"""
    return pagina(curso, f"{curso['titulo']} · {curso['instituicao']}", corpo, "")


def objetivos(aula: dict) -> str:
    """Objetivos de aprendizagem como lista discreta dentro da introdução da aula."""
    if not aula.get("objetivos"):
        return ""
    itens = "".join(f"<li>{inline(o)}</li>" for o in aula["objetivos"])
    return f'<ul class="objetivos" aria-label="Objetivos de aprendizagem">{itens}</ul>'


def gerar_aula(curso: dict, n: int, aula: dict) -> str:
    """Página de uma aula: a apresentação e os recursos dela."""
    partes = [f"""<section class="secao">
<p class="rotulo">{marcador(n, aula)}{f" · {escape(aula['horario'])}" if aula.get('horario') else ''}</p>
<h1>{escape(aula['titulo'])}</h1>
{f"<p>{escape(aula['subtitulo'])}</p>" if aula.get('subtitulo') else ''}
{f"<p>{inline(aula['proposito'])}</p>" if aula.get('proposito') else ''}
{objetivos(aula)}
</section>"""]
    if aula.get("apresentacao"):
        partes.append(f'<section class="secao"><a class="cartao" href="apresentacao.html"{NOVA_ABA}><span><h3>Apresentação</h3>'
                      f'<p>Abre no navegador · setas do teclado para navegar</p></span><span class="seta">→</span></a></section>')
    if aula.get("recursos"):
        itens = "".join(
            f'<li><a href="{escape(r["link"])}"{NOVA_ABA}>{escape(r["rotulo"])}</a><span class="rotulo">{escape(r["tipo"])}</span></li>'
            if r.get("link") else
            f'<li><a href="{escape(Path(r["arquivo"]).name)}" download{NOVA_ABA}>{escape(r["rotulo"])}</a><span class="rotulo">{escape(r["tipo"])}</span></li>'
            for r in aula["recursos"])
        partes.append(f'<section class="secao"><h2>Recursos</h2><ul class="arquivos">{itens}</ul></section>')
    return pagina(curso, f"{aula['titulo']} · {curso['titulo']}", "\n".join(partes), "../../")


SELETOR = """<script>
/* Seletor de variante (como as abas do Starlight): mostra só os trechos da variante escolhida.
   A escolha vem de ?app=, senão da última escolha neste navegador, senão da primeira variante. */
(() => {
  const raiz = document.documentElement, botoes = [...document.querySelectorAll(".seletor button")];
  const ids = botoes.map(b => b.dataset.v), CHAVE = "variante-guia";
  const ler = () => { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } };
  const escolher = (v, guardar) => {
    raiz.dataset.app = v;
    botoes.forEach(b => b.setAttribute("aria-selected", b.dataset.v === v ? "true" : "false"));
    if (guardar) { try { localStorage.setItem(CHAVE, v); } catch (e) {} history.replaceState(null, "", "?app=" + v + location.hash); }
  };
  const pedida = new URLSearchParams(location.search).get("app");
  escolher([pedida, ler()].find(v => ids.includes(v)) || ids[0], false);
  botoes.forEach(b => b.addEventListener("click", () => escolher(b.dataset.v, true)));
})();
</script>"""


def gerar_preparacao(curso: dict, aula: dict, prep: dict) -> str:
    """Passo a passo no padrão Steps do Starlight: círculos numerados ligados por uma linha.

    Com "variantes" ([{"id", "rotulo"}], por exemplo um aplicativo por variante), a página ganha um seletor ao lado
    do título. Um passo com "variantes": {id: {campos}} troca esses campos conforme a variante; "{app}" em qualquer
    texto vira o rótulo da variante; um problema com um terceiro item (o id) só aparece naquela variante."""
    variantes = prep.get("variantes", [])

    def por_variante(gerar, dados: dict) -> str:
        """Gera o trecho uma vez, ou uma vez por variante quando ele muda com a variante."""
        muda = variantes and ("variantes" in dados or "{app}" in json.dumps(dados, ensure_ascii=False))
        if not muda:
            return gerar(dados)
        partes = []
        for v in variantes:
            d = {**dados, **dados.get("variantes", {}).get(v["id"], {})}
            d = json.loads(json.dumps(d, ensure_ascii=False).replace("{app}", v["rotulo"]))
            partes.append(f'<div class="variante" data-variante="{escape(v["id"])}">{gerar(d)}</div>')
        return "".join(partes)

    def gerar_passo(passo: dict) -> str:
        miolo = [f'<h2>{escape(passo["titulo"])}</h2>']
        textos = passo.get("texto", [])
        if len(textos) > 1:
            miolo.append('<ul class="lista">' + "".join(f"<li>{inline(t)}</li>" for t in textos) + "</ul>")
        elif textos:
            miolo.append(f"<p>{inline(textos[0])}</p>")
        if passo.get("comandos"):
            miolo.append(comando(passo["comandos"]))
        if passo.get("codigo"):
            miolo.append(codigo(passo["codigo"], passo.get("arquivo", "")))
        if passo.get("saida"):
            miolo.append(saida(passo["saida"], passo.get("saida_titulo", "Saída esperada")))
        if passo.get("tabela"):
            miolo.append(tabela(passo["tabela"]))
        miolo += [f"<p>{inline(t)}</p>" for t in passo.get("depois", [])]
        if passo.get("aviso"):
            miolo.append(f'<p class="aviso"><strong>Atenção</strong> {inline(passo["aviso"])}</p>')
        return "".join(miolo)

    seletor, estilo = "", ""
    if variantes:
        botoes = "".join(f'<button type="button" role="tab" data-v="{escape(v["id"])}" aria-selected="{"true" if k == 0 else "false"}">'
                         f'{escape(v["rotulo"])}</button>' for k, v in enumerate(variantes))
        seletor = f'<div class="seletor" role="tablist" aria-label="Aplicativo">{botoes}</div>'
        primeira = escape(variantes[0]["id"])
        regras = "".join(f'html[data-app="{escape(v["id"])}"] .variante[data-variante="{escape(v["id"])}"] {{ display: block; }}' for v in variantes)
        estilo = (f'<style>.variante {{ display: none; }} html:not([data-app]) .variante[data-variante="{primeira}"] {{ display: block; }}'
                  f'{regras}</style>')
    topo = f"""<section class="secao">
<p class="rotulo"><a href="../">{escape(aula['titulo'])}</a></p>
<div class="titulo-guia"><h1>{escape(prep['titulo'])}</h1>{seletor}</div>
{por_variante(lambda d: f"<p>{inline(d['resumo'])}</p>", {"resumo": prep["resumo"]})}
{f"<p>{inline(prep['contexto'])}</p>" if prep.get('contexto') else ''}
</section>"""
    etapas = [f'<li class="etapa" id="passo-{n}">{por_variante(gerar_passo, passo)}</li>' for n, passo in enumerate(prep["passos"], 1)]
    partes = [estilo + topo, f'<section class="secao"><ol class="etapas">{"".join(etapas)}</ol></section>']
    if prep.get("problemas"):
        itens = []
        for problema in prep["problemas"]:
            sintoma, solucao, *so = problema
            item = f'<li><p class="sintoma">{inline(sintoma)}</p><p>{inline(solucao)}</p></li>'
            itens.append(item.replace("<li>", f'<li class="variante" data-variante="{escape(so[0])}">', 1) if so else item)
        fecho = f'<p class="rotulo">{inline(prep["fechamento"])}</p>' if prep.get("fechamento") else ""
        partes.append(f'<section class="secao"><h2>Se algo der errado</h2><ul class="problemas">{"".join(itens)}</ul>{fecho}</section>')
    if prep.get("dia_da_aula"):
        partes.append(f'<section class="secao"><h2>No dia da aula</h2>{comando(prep["dia_da_aula"])}</section>')
    if variantes:
        partes.append(SELETOR)
    return pagina(curso, f"{prep['titulo']} · {aula['titulo']}", "\n".join(partes), "../../../")



def servir(porta: int) -> None:
    manipulador = partial(http.server.SimpleHTTPRequestHandler, directory=str(SAIDA))
    with http.server.ThreadingHTTPServer(("127.0.0.1", porta), manipulador) as servidor:
        print(f"prévia em http://localhost:{porta}/  (Ctrl+C para parar)")
        servidor.serve_forever()



def main() -> None:
    global PREVIA
    parser = argparse.ArgumentParser(description="Gera o site do curso em _site/.")
    parser.add_argument("--previa", action="store_true", help="inclui rascunhos e serve o site localmente")
    parser.add_argument("--porta", type=int, default=8000)
    args = parser.parse_args()
    PREVIA = args.previa
    curso = json.loads((RAIZ / "curso.json").read_text(encoding="utf-8"))
    slugs = [a["slug"] for a in curso["aulas"]]
    if len(slugs) != len(set(slugs)):
        raise SystemExit("curso.json: slugs de aula repetidos")
    if SAIDA.exists():
        shutil.rmtree(SAIDA)
    SAIDA.mkdir()
    shutil.copy(RAIZ / "site" / "estilo.css", SAIDA / "estilo.css")
    (SAIDA / ".nojekyll").touch()
    (SAIDA / "index.html").write_text(com_portao(gerar_indice(curso), curso), encoding="utf-8")
    for n, aula in enumerate(curso["aulas"], 1):
        if not publicavel(aula):
            continue
        origem = RAIZ / aula["pasta"]
        destino = SAIDA / "aulas" / aula["slug"]
        destino.mkdir(parents=True)
        if aula.get("apresentacao"):
            shutil.copy(origem / aula["apresentacao"], destino / "apresentacao.html")
        for item in aula.get("recursos", []):
            if item.get("arquivo"):
                shutil.copy(origem / item["arquivo"], destino / Path(item["arquivo"]).name)
        # Passo a passo e roteiros: cada <pasta>/guias/<nome>.json vira aulas/<slug>/<nome>/.
        for guia in sorted((origem / "guias").glob("*.json")):
            prep = json.loads(guia.read_text(encoding="utf-8"))
            (destino / guia.stem).mkdir()
            (destino / guia.stem / "index.html").write_text(gerar_preparacao(curso, aula, prep), encoding="utf-8")
        for html in destino.rglob("*.html"):
            html.write_text(com_portao(html.read_text(encoding="utf-8"), curso), encoding="utf-8")
        (destino / "index.html").write_text(com_portao(gerar_aula(curso, n, aula), curso), encoding="utf-8")
    print(f"site gerado em {SAIDA}")
    if PREVIA:
        servir(args.porta)


if __name__ == "__main__":
    main()
