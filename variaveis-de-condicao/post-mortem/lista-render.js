/* Monta a lista de exercícios a partir de window.LISTA (lista.js), antes do deck.js: uma questão objetiva por
   slide e, no fim, as dissertativas (sem resposta).
   Na questão, o aluno escolhe uma alternativa (clique, toque ou teclas A a D) e confirma (botão ou Enter); só então
   a alternativa fica verde ou vermelha e o painel ao lado mostra o feedback daquela alternativa e onde revisar.
   Blocos de código no padrão do Expressive Code (Starlight): moldura de editor com aba do arquivo, botão de copiar
   e realce de C. As linhas não quebram sozinhas: quebre as longas no lista.js (verificar.mjs avisa).
   Cópia do modelo da skill lista-exercicios (Disciplinas/compartilhado/modulo-inteli/skills/lista-exercicios/modelo/):
   uma melhoria feita aqui deve voltar para o modelo. */
(function () {
  const L = window.LISTA;
  const deck = document.querySelector("main.deck");
  const LOGO = document.getElementById("logo-modelo").src;  // estático no deck.html, para o build embutir a imagem
  const LETRAS = "ABCD";

  const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // **negrito** e `código` (o código não quebra no meio)
  const marcar = (s) => esc(s)
    .replace(/\*\*`([^`]+)`\*\*/g, "<b><code>$1</code></b>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  const logo = () => { const i = h("img", "logo"); i.src = LOGO; i.alt = "inteli"; return i; };
  const slide = (cls, attrs = {}) => {
    const s = h("section", "slide sem-numero" + (cls ? " " + cls : ""));  // o número do slide não é o da questão
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    deck.append(s);
    return s;
  };

  /* ---------- links para o livro ----------
     Cada "seção X.Y", "fig. X.Y", "quadro <Título>" e "introdução do capítulo" vira um link que abre o PDF do
     capítulo na página certa (#page=N), segundo window.LIVRO (livro.js, gerado por mapear_livro.py).
     O capítulo de uma seção ou figura sai do próprio número; o de um quadro, do "cap. N" do texto ou da questão. */
  function linkLivro(cap, tipo, valor, rotulo) {
    const LV = window.LIVRO;
    const pag = LV && LV.paginas[`${cap}|${tipo}|${valor}`];
    if (!pag || !LV.urls[cap]) return rotulo;
    return `<a href="${LV.urls[cap]}#page=${pag}" target="_blank" rel="noopener">${rotulo}</a>`;
  }
  function comLinks(html, capPadrao) {
    const mc = html.match(/cap\. (\d+)/);
    const cap = mc ? +mc[1] : capPadrao;
    return html
      .replace(/(seç(?:ão|ões)|figs?\.)(\s+)([\d.]+(?:(?:,\s*|\s+e\s+|\s+a\s+)[\d.]+)*)/g, (m, palavra, esp, nums) => {
        const tipo = palavra.startsWith("fig") ? "fig" : "secao";
        return palavra + esp + nums.replace(/\d+\.\d+/g, (n) => linkLivro(+n.split(".")[0], tipo, n, n));
      })
      .replace(/(quadro (?:sobre )?)([A-Z][^,()<]*?)(?=\s*(?:\(|\)|,|$| e a | e o | e as | e os ))/g,
        (m, pre, titulo) => pre + linkLivro(cap, "quadro", titulo.trim(), titulo))
      .replace(/introdução do capítulo/g, (m) => linkLivro(cap, "intro", String(cap), m));
  }

  /* ---------- realce de C (classes tk-*, como no Expressive Code) ---------- */
  const PALAVRAS_C = new Set("if else while for do return break continue switch case default goto sizeof typedef struct union enum static const volatile extern register inline".split(" "));
  const TIPOS_C = new Set("void int char long short unsigned signed float double bool size_t".split(" "));
  const CONSTANTES_C = new Set(["NULL", "true", "false"]);
  function realceC(codigo) {
    const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(^[ \t]*#[^\n]*)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(->|==|!=|<=|>=|&&|\|\||\+\+|--|[-+*\/%=<>!&|^~?])|([()[\]{}.,:;])|(\s+)|([\s\S])/gm;
    let html = "";
    for (const m of codigo.matchAll(re)) {
      const [t, com, str, pre, num, nome, op, pont] = m;
      let tipo = null;
      if (com) tipo = "comentario";
      else if (str) tipo = "string";
      else if (pre) tipo = "palavra";
      else if (num) tipo = "numero";
      else if (nome) {
        if (PALAVRAS_C.has(t)) tipo = "palavra";
        else if (TIPOS_C.has(t) || /_t$/.test(t)) tipo = "tipo";
        else if (CONSTANTES_C.has(t)) tipo = "constante";
        else if (/^\s*\(/.test(codigo.slice(m.index + t.length))) tipo = "funcao";
      } else if (op) tipo = "operador";
      else if (pont) tipo = "pontuacao";
      html += tipo ? `<span class="tk-${tipo}">${esc(t)}</span>` : esc(t);
    }
    return html;
  }
  const ICONE_COPIAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8 V4 a1 1 0 0 0-1-1 H4 a1 1 0 0 0-1 1 V15 a1 1 0 0 0 1 1 H8"/></svg>';
  const ICONE_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12 L10 17 L20 6"/></svg>';
  function blocoCodigo(c) {
    const bl = h("div", "bloco-codigo objeto");                  // objeto: o código pode ter fonte menor que 28px
    if (c.fonte) bl.style.setProperty("--codigo-fonte", c.fonte + "px");
    const barra = h("div", "codigo-barra");
    const copiar = h("button", "copiar-codigo");
    copiar.type = "button"; copiar.title = "Copiar código"; copiar.innerHTML = ICONE_COPIAR;
    copiar.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(c.texto); copiar.innerHTML = ICONE_OK; } catch (_) { /* sem permissão: o aluno seleciona */ }
      setTimeout(() => (copiar.innerHTML = ICONE_COPIAR), 2000);
    });
    barra.append(h("span", "codigo-arquivo", c.titulo || "código C"), copiar);
    const pre = h("pre", "codigo-pre");
    pre.innerHTML = `<code>${realceC(c.texto)}</code>`;
    bl.append(barra, pre);
    return bl;
  }

  /* ---------- questões ---------- */
  const total = L.questoes.length;
  L.questoes.forEach((q, n) => {
    const sec = slide("questao", { "data-modelo": "lista-questao", "data-max-palavras": "260" });
    sec.append(logo());

    const esq = h("div", "q-esq");
    esq.append(h("p", "rotulo-termo q-rot", `Questão ${n + 1} de ${total}` + (L.mostrarGrau === false ? "" : ` · ${q.dif}`)));
    const en = h("p", "q-enunciado"); en.innerHTML = marcar(q.enunciado);
    esq.append(en);
    (q.codigo || []).forEach((c) => esq.append(blocoCodigo(c)));

    const dir = h("div", "q-dir");
    const cmd = h("p", "q-comando"); cmd.innerHTML = marcar(q.comando);
    dir.append(cmd);
    let escolhida = null;
    const bs = q.alt.map((a, i) => {
      const b = h("button", "q-alt");
      const t = h("span", "txt"); t.innerHTML = marcar(a);
      b.append(h("span", "letra", LETRAS[i]), t);
      b.addEventListener("click", () => escolher(i));
      dir.append(b);
      return b;
    });
    const acoes = h("div", "q-acoes");
    const bConfirmar = h("button", "q-confirmar", "Confirmar");
    bConfirmar.disabled = true;
    bConfirmar.addEventListener("click", () => confirmar());
    const bFb = h("button", "q-volta", "ver o feedback");
    bFb.addEventListener("click", () => sec.classList.add("respondida"));
    acoes.append(bConfirmar, bFb);
    dir.append(acoes);

    // feedback: cobre o enunciado, alinhado verticalmente com a coluna das alternativas
    const fb = h("div", "q-fb");
    const fbRes = h("p", "q-fb-res");
    const fbTxt = h("p", "q-fb-txt");
    const fbRev = h("p", "q-fb-rev");
    const bEnunciado = h("button", "q-volta", "ver o enunciado");
    bEnunciado.addEventListener("click", () => sec.classList.remove("respondida"));
    fb.append(fbRes, fbTxt, fbRev, bEnunciado);

    function escolher(i) {
      escolhida = i;
      bConfirmar.disabled = false;
      bs.forEach((b, k) => { b.classList.toggle("escolhida", k === i); b.classList.remove("certa", "errada"); });
    }
    function confirmar() {
      if (escolhida === null) return;
      const i = escolhida, certa = i === q.gab;
      bs.forEach((b, k) => { b.classList.toggle("certa", certa && k === i); b.classList.toggle("errada", !certa && k === i); });
      fb.classList.toggle("acertou", certa);
      fbRes.textContent = certa ? `${LETRAS[i]}: acertou!` : `${LETRAS[i]}: não é essa.`;
      fbTxt.innerHTML = comLinks(marcar(q.fb[i]), q.cap);
      fbRev.innerHTML = `<b>Para revisar:</b> ${comLinks(esc(q.revisar), q.cap)}`;
      sec.classList.add("respondida", "confirmou");
      bConfirmar.disabled = true;
      fb.style.top = dir.offsetTop + "px";
      fb.style.minHeight = dir.offsetHeight + "px";
    }
    sec._escolher = escolher;
    sec._confirmar = confirmar;
    sec.append(esq, fb, dir, h("aside", "notas", `Resposta: ${LETRAS[q.gab]}` + (L.mostrarGrau === false ? "." : ` (${q.dif}).`)));
  });

  // teclas A a D escolhem e Enter confirma, no slide visível (o deck.js marca-o com .atual). Na captura, antes do
  // deck.js: o Enter que confirma não pode também avançar o slide.
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const sec = document.querySelector(".slide.questao.atual");
    if (!sec) return;
    const i = LETRAS.indexOf(e.key.toUpperCase());
    if (i >= 0) sec._escolher(i);
    else if (e.key === "Enter") { sec._confirmar(); e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

  /* ---------- dissertativas, sem resposta ---------- */
  document.title = L.titulo;
  L.dissertativas.forEach((d, k) => {
    const s = slide("dissertativa", { "data-modelo": "lista-dissertativa", "data-max-palavras": "200" });
    s.append(logo(), h("p", "rotulo-termo q-rot", `Questão dissertativa ${k + 1}`));
    const c = h("div", "d-corpo");
    const en = h("p", "d-enunciado"); en.innerHTML = marcar(d.enunciado);
    c.append(en);
    if (d.codigo) {  // o código vai numa coluna à direita, e o texto fica à esquerda
      s.classList.add("com-codigo");
      const col = h("div", "d-codigo");
      d.codigo.forEach((cd) => col.append(blocoCodigo(cd)));
      s.append(col);
    }
    (d.itens || []).forEach((it) => { const p = h("p", "d-item"); p.innerHTML = marcar(it); c.append(p); });
    if (d.fechamento) { const p = h("p", "d-fechamento"); p.innerHTML = marcar(d.fechamento); c.append(p); }
    s.append(c);
  });
})();
