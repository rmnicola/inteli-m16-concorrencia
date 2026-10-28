/* Simuladores da aula de locks (OSTEP, caps. 28 e 29).
   Cada <div class="sim" data-sim="..."> é montado aqui, em coordenadas da tela de 1600 × 900.
   Também monta os slides de questão (.slide[data-q], a partir de questoes.js) e os de placar (.slide.placar). */
(function () {
  /* ---------- utilitários ---------- */
  function h(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }
  function pos(e, x, y, w, alt) {
    e.style.left = x + "px"; e.style.top = y + "px";
    if (w != null) e.style.width = w + "px";
    if (alt != null) e.style.height = alt + "px";
    return e;
  }
  const num = (v, casas = 2) => v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
  /* **negrito** e `código` em texto que vai para innerHTML */
  const marcar = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>");
  const ICONES = {
    reiniciar: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4 4v5h5"/>',
    passo: '<path d="M4 15a8 8 0 0 1 15.5-2.8"/><path d="M20 7v6h-6"/><circle cx="12" cy="19.5" r="1.8" fill="currentColor"/>',
    tocar: '<path d="M7 5l12 7-12 7z"/>',
    pausar: '<path d="M8 5v14M16 5v14"/>',
    olho: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  };
  function icone(nome, titulo, ajuda, f) {
    const b = h("button", "icone");
    b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${ICONES[nome]}</svg>`;
    b.title = titulo;
    if (ajuda) b.dataset.ajuda = ajuda;
    b.addEventListener("click", f);
    return b;
  }
  /* Grupo de botões de opção (um ativo por vez). */
  function opcoes(rotulo, itens, valor, aoMudar, ajuda) {
    const caixa = h("div", "opcoes");
    if (rotulo) caixa.append(h("span", "cab", rotulo));
    const bs = itens.map(([v, txt]) => {
      const b = h("button", "", txt);
      b.addEventListener("click", () => { definir(v); aoMudar(v); });
      caixa.append(b);
      return [v, b];
    });
    const definir = (v) => bs.forEach(([x, b]) => b.classList.toggle("ativo", x === v));
    definir(valor);
    if (ajuda) caixa.dataset.ajuda = ajuda;
    return { el: caixa, definir };
  }
  /* Controle deslizante com rótulo e valor. */
  function controle(rotulo, { min, max, passo = 1, valor, fmt = String }, aoMudar, ajuda) {
    const caixa = h("div", "controle");
    const topo = h("div", "linha");
    const v = h("span", "conta");
    topo.append(h("span", "cab", rotulo), v);
    const inp = h("input");
    Object.assign(inp, { type: "range", min, max, step: passo, value: valor });
    caixa.append(topo, inp);
    const mostrar = () => (v.textContent = fmt(+inp.value));
    inp.addEventListener("input", () => { mostrar(); aoMudar(+inp.value); });
    mostrar();
    if (ajuda) caixa.dataset.ajuda = ajuda;
    return { el: caixa };
  }
  function titulo(sim, txt) { sim.append(h("h2", "titulo sim-titulo", txt)); }
  /* Gerador pseudoaleatório com semente, para o simulador mostrar sempre o mesmo cenário ao recomeçar. */
  function gerador(semente) {
    let s = semente;
    return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  }

  const SIMS = {};

  /* ---------- Quem pega o lock? (caps. 28.6 a 28.11) ----------
     A turma é o escalonador: o botão de cada thread roda a próxima linha dela. Cada thread repete
     sem parar: pega o lock, lê count, escreve count + 1, libera. data-lock escolhe o lock. */
  const LOCKS = {
    flag: {
      vars: ["flag", "count"],
      linhas: ["while (flag == 1) ;", "flag = 1;", "tmp = count;", "count = tmp + 1;", "flag = 0;"],
      dentro: [2, 3, 4], cs: [2, 3],
      passo(t, m) {
        if (t.pc === 0) { if (m.flag === 1) return "gira"; t.pc = 1; return; }
        if (t.pc === 1) { m.flag = 1; t.pc = 2; return; }
        if (t.pc === 2) { t.tmp = m.count; t.pc = 3; return; }
        if (t.pc === 3) { m.count = t.tmp + 1; t.entrou++; t.pc = 4; return; }
        m.flag = 0; t.pc = 0;
      },
    },
    tas: {
      vars: ["flag", "count"],
      linhas: ["while (TAS(&flag)) ;", "tmp = count;", "count = tmp + 1;", "flag = 0;"],
      dentro: [1, 2, 3], cs: [1, 2],
      passo(t, m) {
        if (t.pc === 0) { const velho = m.flag; m.flag = 1; if (velho === 1) return "gira"; t.pc = 1; return; }
        if (t.pc === 1) { t.tmp = m.count; t.pc = 2; return; }
        if (t.pc === 2) { m.count = t.tmp + 1; t.entrou++; t.pc = 3; return; }
        m.flag = 0; t.pc = 0;
      },
    },
    ticket: {
      vars: ["ticket", "turn", "count"],
      linhas: ["eu = FAA(&ticket);", "while (turn != eu) ;", "tmp = count;", "count = tmp + 1;", "turn = turn + 1;"],
      dentro: [2, 3, 4], cs: [2, 3],
      passo(t, m) {
        if (t.pc === 0) { t.eu = m.ticket; m.ticket++; t.pc = 1; return; }
        if (t.pc === 1) { if (m.turn !== t.eu) return "gira"; t.pc = 2; return; }
        if (t.pc === 2) { t.tmp = m.count; t.pc = 3; return; }
        if (t.pc === 3) { m.count = t.tmp + 1; t.entrou++; t.pc = 4; return; }
        m.turn++; t.pc = 0; t.eu = null;
      },
    },
  };
  SIMS.lock = function (sim) {
    const L = LOCKS[sim.dataset.lock];
    const podeTres = sim.dataset.lock !== "flag";
    const st = { n: 2 };
    titulo(sim, "Quem pega o lock?");

    const paineis = [0, 1, 2].map((i) => {
      const p = pos(h("div", "thr"), 120 + i * 465, 160, 440);
      const cab = h("div", "cab-thr");
      const estado = h("span", "estado");
      cab.append(h("span", "nome", `T${i + 1}`), estado);
      const cod = h("div", "cod-thr");
      const linhas = L.linhas.map((txt, k) => {
        const l = h("div", "ins" + (L.cs.includes(k) ? " em-cs" : ""), txt);
        cod.append(l);
        return l;
      });
      const regs = h("div", "regs");
      const tmp = h("span", "chip"); const eu = h("span", "chip");
      regs.append(h("span", "", "tmp"), tmp);
      if (sim.dataset.lock === "ticket") regs.append(h("span", "", "eu"), eu);
      const conta = h("div", "conta-thr");
      const bExec = icone("passo", `próxima linha de T${i + 1}`, "", () => executar(i));
      const baixo = h("div", "baixo-thr");
      baixo.append(bExec, conta);
      p.append(cab, cod, regs, baixo);
      sim.append(p);
      if (i === 0) {
        cod.dataset.ajuda = "O código da thread. A linha com contorno é a próxima; a barra à esquerda marca a seção crítica, que lê e escreve o count compartilhado.";
        regs.dataset.ajuda = sim.dataset.lock === "ticket"
          ? "Registradores desta thread: tmp guarda o count lido; eu guarda o número que ela pegou no FAA (fetch-and-add)."
          : "O registrador tmp desta thread: guarda o count lido, para somar 1 e escrever de volta.";
        bExec.dataset.ajuda = "Roda a próxima linha desta thread. Vocês são o escalonador: escolham quem roda e quando.";
        conta.dataset.ajuda = "Quantas vezes a thread passou pela seção crítica, e quantas vezes testou o lock e o encontrou ocupado (girou).";
      }
      return { p, estado, linhas, tmp, eu, conta, bExec };
    });

    /* embaixo, numa linha só: a memória compartilhada, os controles e os avisos */
    const baixo = pos(h("div", "baixo-lock"), 120, 650, 1360);
    const mem = h("div", "mem-linha");
    const caixas = Object.fromEntries(L.vars.map((v) => {
      const c = h("div", "mem");
      const valor = h("span", "valor");
      c.append(h("span", "cab", v), valor);
      mem.append(c);
      return [v, valor];
    }));
    mem.dataset.ajuda = sim.dataset.lock === "ticket"
      ? "A memória compartilhada: ticket é o próximo número a distribuir, turn é o número da vez, count é o contador."
      : "A memória compartilhada: o flag do lock (1 = ocupado) e o count, que as threads incrementam.";
    const rodape = h("div", "rodape-sim");
    if (podeTres) {
      const op = opcoes("threads", [[2, "2"], [3, "3"]], 2, (v) => { st.n = v; zerar(); }, "Quantas threads disputam o lock.");
      rodape.append(op.el);
    }
    rodape.append(icone("reiniciar", "recomeçar", "Recomeça com o lock livre e count = 0.", () => zerar()));
    const aviso = h("div", "aviso-lock");
    baixo.append(mem, rodape, aviso);
    sim.append(baixo);

    function zerar() {
      st.m = Object.fromEntries(L.vars.map((v) => [v, 0]));
      st.t = [0, 1, 2].map(() => ({ pc: 0, tmp: null, eu: null, entrou: 0, girou: 0, girando: false }));
      st.rodando = null;
      desenhar();
    }
    function executar(i) {
      const t = st.t[i];
      st.rodando = i;
      const r = L.passo(t, st.m);
      t.girando = r === "gira";
      if (t.girando) t.girou++;
      desenhar();
    }
    function desenhar() {
      const dentro = [];
      paineis.forEach((pn, i) => {
        const t = st.t[i];
        pn.p.style.display = i < st.n ? "" : "none";
        if (i >= st.n) return;
        const temLock = L.dentro.includes(t.pc);
        if (temLock) dentro.push(i);
        pn.p.classList.toggle("rodando", st.rodando === i);
        pn.p.classList.toggle("com-lock", temLock);
        pn.estado.textContent = t.girando ? "girando" : temLock ? "com o lock" : st.rodando === i ? "na CPU" : "pronta";
        pn.linhas.forEach((l, k) => l.classList.toggle("proxima", k === t.pc));
        pn.tmp.textContent = t.tmp === null ? "–" : String(t.tmp);
        pn.eu.textContent = t.eu === null ? "–" : String(t.eu);
        pn.conta.textContent = `entrou ${t.entrou} · girou ${t.girou}`;
      });
      for (const [v, el] of Object.entries(caixas)) el.textContent = String(st.m[v]);
      const passou = st.t.slice(0, st.n).reduce((s, t) => s + t.entrou, 0);
      aviso.replaceChildren();
      if (dentro.length > 1) aviso.append(h("p", "ruim", `${dentro.map((i) => "T" + (i + 1)).join(" e ")} estão com o lock ao mesmo tempo!`));
      if (st.m.count < passou) aviso.append(h("p", "ruim", `count = ${st.m.count}, mas houve ${passou} incrementos.`));
    }
    zerar();
  };

  /* ---------- Girando à toa (caps. 28.12 a 28.14) ----------
     N threads repetem: trabalham fora do lock (tempo sorteado), pegam o lock, ficam 3 unidades na seção
     crítica e liberam. Rodízio com quantum de 6 unidades; cada troca de contexto custa 1 unidade.
     Quem encontra o lock ocupado: gira até o fim do quantum, cede a CPU (yield) ou dorme na fila do lock. */
  function simularEspera({ n, cpus, modo, H, Q = 6, C = 3, W = 8, TROCA = 1, semente = 3 }) {
    const aleat = gerador(semente);
    const wAleat = () => 1 + Math.floor(aleat() * W);
    const th = Array.from({ length: n }, (_, i) => ({ id: i, fase: "quer", resta: 0, cel: [] }));
    let dono = null;
    const filaLock = [], prontas = th.slice(), ordem = [];
    const cpu = Array.from({ length: cpus }, () => ({ atual: null, fatia: 0, troca: 0, prox: null }));
    const st = { util: 0, gira: 0, troca: 0, ocioso: 0 };
    for (const c of cpu) if (prontas.length) { c.atual = prontas.shift(); c.fatia = Q; }
    const sair = (c, volta) => {
      if (volta) prontas.push(c.atual);
      c.atual = null;
      if (prontas.length) { c.prox = prontas.shift(); c.troca = TROCA; }
    };
    function liberar(x) {
      x.fase = "trab"; x.resta = wAleat();
      if (modo === "fila" && filaLock.length) {
        const w = filaLock.shift();
        dono = w; ordem.push(w.id); w.fase = "cs"; w.resta = C; prontas.push(w);
      } else dono = null;
    }
    for (let t = 0; t < H; t++) {
      const fez = new Map();
      for (const c of cpu) {
        if (c.troca > 0) {
          st.troca++;
          if (--c.troca === 0) { c.atual = c.prox; c.prox = null; c.fatia = Q; }
          continue;
        }
        if (!c.atual) {
          if (prontas.length) { c.atual = prontas.shift(); c.fatia = Q; st.troca++; } else st.ocioso++;
          continue;
        }
        const x = c.atual;
        let estado, cede = false;
        if (x.fase === "trab") { estado = "trab"; st.util++; if (--x.resta === 0) x.fase = "quer"; }
        else if (x.fase === "quer") {
          if (dono === null) {
            dono = x; ordem.push(x.id); x.fase = "cs"; x.resta = C - 1; estado = "cs"; st.util++;
            if (x.resta === 0) liberar(x);
          } else {
            estado = "gira"; st.gira++;
            if (modo === "yield") cede = true;
            if (modo === "fila") { x.fase = "dorme"; filaLock.push(x); cede = true; }
          }
        } else if (x.fase === "cs") { estado = "cs"; st.util++; if (--x.resta === 0) liberar(x); }
        fez.set(x, estado);
        c.fatia--;
        if (x.fase === "dorme") sair(c, false);
        else if (cede || c.fatia === 0) { if (prontas.length) sair(c, true); else c.fatia = Q; }
      }
      for (const x of th) x.cel.push(fez.get(x) || (x.fase === "dorme" ? "dorme" : "pronta"));
    }
    const total = H * cpus;
    return { th, ordem, pct: (k) => (100 * st[k]) / total };
  }
  SIMS.espera = function (sim) {
    const st = { n: 4, cpus: 1, modo: "girar" };
    const H = 64, X0 = 200, LARG = 1280;
    titulo(sim, "Girando à toa");
    const ctl = pos(h("div", "ctl-linha"), 120, 160);
    const opModo = opcoes("", [["girar", "girar"], ["yield", "yield"], ["fila", "fila"]], st.modo, (v) => { st.modo = v; desenhar(); },
      "O que a thread faz quando encontra o lock ocupado: gira até o fim do quantum, cede a CPU (yield) ou dorme na fila do lock até a dona acordá-la.");
    const opCpus = opcoes("CPUs", [[1, "1"], [2, "2"]], st.cpus, (v) => { st.cpus = v; desenhar(); }, "Quantas CPUs rodam as threads.");
    const ctN = controle("threads", { min: 2, max: 8, valor: st.n }, (v) => { st.n = v; desenhar(); }, "Quantas threads disputam o lock.");
    ctN.el.style.width = "260px";
    ctl.append(opModo.el, opCpus.el, ctN.el);
    sim.append(ctl);

    const grade = pos(h("div", "grade-tempo"), 120, 250, LARG + X0 - 120);
    grade.dataset.ajuda = "Uma linha por thread; o tempo corre para a direita. A cor diz o que a thread fez em cada unidade de tempo (legenda embaixo).";
    sim.append(grade);
    const leg = pos(h("div", "legenda-tempo"), 120, 690);
    [["cs", "seção crítica"], ["trab", "fora do lock"], ["gira", "girando ou tentando"], ["dorme", "dormindo"], ["pronta", "esperando a CPU"]]
      .forEach(([c, t]) => { const i = h("span", "item-leg"); i.append(h("i", "cel " + c), h("span", "", t)); leg.append(i); });
    sim.append(leg);
    const resumo = pos(h("div", "resumo-tempo"), 120, 760, 1360);
    resumo.dataset.ajuda = "Como a CPU foi usada no período mostrado, e a ordem em que as threads pegaram o lock.";
    sim.append(resumo);

    function desenhar() {
      const r = simularEspera({ n: st.n, cpus: st.cpus, modo: st.modo, H });
      const alt = Math.min(48, Math.floor(400 / st.n));
      const w = (LARG - X0 + 120) / H;
      grade.replaceChildren();
      r.th.forEach((x, i) => {
        const linha = h("div", "linha-tempo");
        linha.style.height = alt + "px";
        linha.append(h("span", "quem", "T" + (i + 1)));
        const faixa = h("div", "faixa");
        x.cel.forEach((c) => { const d = h("i", "cel " + c); d.style.width = w + "px"; faixa.append(d); });
        linha.append(faixa);
        grade.append(linha);
      });
      const p = (k) => Math.round(r.pct(k)) + "%";
      resumo.innerHTML = `<p><b>CPU:</b> trabalho ${p("util")} · girando ${p("gira")} · trocas de contexto ${p("troca")}${r.pct("ocioso") >= 1 ? " · parada " + p("ocioso") : ""}</p>` +
        `<p><b>pegaram o lock:</b> ${r.ordem.slice(0, 18).map((i) => "T" + (i + 1)).join(" ")}</p>`;
    }
    desenhar();
  };

  /* ---------- Contador aproximado (cap. 29.1, fig. 29.3) ----------
     Quatro CPUs, cada uma com um contador local; quando um local chega a S, o valor vai para o global G.
     Clique num local para incrementá-lo, ou deixe o simulador sortear. */
  SIMS.aprox = function (sim) {
    const N = 4;
    const st = { S: 5 };
    const aleat = gerador(3);
    titulo(sim, "Contador aproximado");
    const locais = Array.from({ length: N }, (_, i) => {
      const c = pos(h("button", "local"), 120 + i * 250, 170, 220);
      const v = h("span", "valor");
      const barra = h("div", "barra-s");
      c.append(h("span", "cab", `L${i + 1} · CPU ${i + 1}`), v, barra);
      c.addEventListener("click", () => { incrementar(i); desenhar(); });
      sim.append(c);
      if (i === 0) c.dataset.ajuda = "O contador local da CPU 1. Clique para incrementar. A barra mostra quanto falta para chegar a S, quando o valor vai para o global.";
      return { c, v, barra };
    });
    const g = pos(h("div", "global"), 1130, 170, 350);
    const gv = h("span", "valor");
    g.append(h("span", "cab", "G · global"), gv);
    g.dataset.ajuda = "O contador global, protegido por um lock. Só muda quando um local chega a S: aí o local inteiro é somado a ele.";
    sim.append(g);

    const contas = pos(h("div", "contas-aprox"), 120, 430, 900);
    contas.dataset.ajuda = "A contagem real (todos os incrementos), o que o global mostra e a diferença entre os dois.";
    sim.append(contas);
    const trilha = pos(h("div", "trilha"), 120, 600, 1360);
    trilha.dataset.ajuda = "Os últimos incrementos, em ordem. Uma seta marca quando um local foi transferido para o global.";
    sim.append(trilha);

    const rodape = pos(h("div", "rodape-sim"), 120, 700);
    const ctS = controle("limiar S", { min: 1, max: 8, valor: st.S }, (v) => { st.S = v; zerar(); }, "O limiar S: quantos incrementos um local acumula antes de passar para o global.");
    ctS.el.style.width = "300px";
    let relogio = null;
    const bTocar = icone("tocar", "sortear incrementos sem parar", "Sorteia incrementos sem parar, em CPUs aleatórias. Clique de novo para pausar.", () => alternar());
    const bPasso = icone("passo", "um incremento numa CPU sorteada", "Um incremento numa CPU sorteada.", () => { incrementar(Math.floor(aleat() * N)); desenhar(); });
    const bZerar = icone("reiniciar", "zerar", "Zera todos os contadores.", () => zerar());
    rodape.append(ctS.el, bPasso, bTocar, bZerar);
    sim.append(rodape);

    function zerar() { Object.assign(st, { L: Array(N).fill(0), G: 0, real: 0, log: [] }); desenhar(); }
    function incrementar(i) {
      st.L[i]++; st.real++;
      const ev = { i, transf: false };
      if (st.L[i] >= st.S) { st.G += st.L[i]; st.L[i] = 0; ev.transf = true; }
      st.log.push(ev);
      if (st.log.length > 14) st.log.shift();
    }
    function alternar() {
      if (relogio) { clearInterval(relogio); relogio = null; }
      else relogio = setInterval(() => { incrementar(Math.floor(aleat() * N)); desenhar(); }, 450);
      bTocar.querySelector("svg").innerHTML = relogio ? ICONES.pausar : ICONES.tocar;
    }
    function desenhar() {
      locais.forEach((l, i) => {
        l.v.textContent = String(st.L[i]);
        l.barra.replaceChildren(...Array.from({ length: st.S }, (_, k) => h("i", k < st.L[i] ? "cheio" : "")));
      });
      gv.textContent = String(st.G);
      contas.innerHTML = `<p>contagem real <b>${st.real}</b></p><p>global <b>${st.G}</b></p>` +
        `<p>atraso <b class="${st.real - st.G ? "atrasado" : ""}">${st.real - st.G}</b> <span class="cab">(no máximo ${N} × (S − 1) = ${N * (st.S - 1)})</span></p>`;
      trilha.replaceChildren(h("span", "rot-trilha", "incrementos"));
      st.log.forEach((ev) => trilha.append(h("span", "ev" + (ev.transf ? " transf" : ""), `L${ev.i + 1}${ev.transf ? " → G" : ""}`)));
    }
    zerar();
  };

  /* ---------- Quanto custa a precisão (cap. 29.1, figs. 29.5 e 29.6) ----------
     Tempos medidos com o contador.c desta aula (mediana de 3 execuções, 1 milhão de incrementos por thread,
     numa máquina de 12 CPUs). S = 0 é o contador exato. */
  const MEDIDAS = {
    0: [0.019, 0.097, 0.303, 0.579], 1: [0.026, 0.055, 0.135, 0.657], 4: [0.015, 0.024, 0.06, 0.219],
    16: [0.012, 0.018, 0.028, 0.057], 64: [0.012, 0.015, 0.024, 0.029], 256: [0.012, 0.017, 0.018, 0.026],
    1024: [0.012, 0.013, 0.018, 0.028],
  };
  const THREADS = [1, 2, 4, 8];
  SIMS.custo = function (sim) {
    const st = { S: 1024 };
    titulo(sim, "Quanto custa a precisão");
    const ns = "http://www.w3.org/2000/svg";
    const G = { x: 300, y: 170, w: 800, h: 520, max: 0.7 };
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "grafico");
    svg.setAttribute("viewBox", "0 0 1600 900");
    sim.append(svg);
    const el = (tag, at, txt) => {
      const e = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(at)) e.setAttribute(k, v);
      if (txt !== undefined) e.textContent = txt;
      svg.append(e);
      return e;
    };
    const px = (i) => G.x + 40 + (i * (G.w - 80)) / 3;
    const py = (v) => G.y + G.h - (v / G.max) * G.h;
    for (const v of [0, 0.2, 0.4, 0.6]) {
      el("line", { x1: G.x, x2: G.x + G.w, y1: py(v), y2: py(v), class: v ? "grade" : "eixo" });
      el("text", { x: G.x - 16, y: py(v) + 10, class: "rot-eixo", "text-anchor": "end" }, num(v, 1) + " s");
    }
    THREADS.forEach((t, i) => el("text", { x: px(i), y: G.y + G.h + 44, class: "rot-eixo", "text-anchor": "middle" }, String(t)));
    el("text", { x: G.x + G.w / 2, y: G.y + G.h + 92, class: "rot-eixo", "text-anchor": "middle" }, "threads");
    const camada = document.createElementNS(ns, "g");
    svg.append(camada);
    const alvoG = pos(h("div", "alvo-ajuda"), G.x, G.y, G.w, G.h);
    alvoG.dataset.ajuda = "Tempo para cada thread fazer 1 milhão de incrementos, medido com o contador.c desta aula numa máquina de 12 CPUs. Passe o mouse num ponto para ver o valor.";
    sim.append(alvoG);

    const lado = pos(h("div", "lado-custo"), 1230, 170, 270);
    const op = opcoes("limiar S", [[1, "1"], [4, "4"], [16, "16"], [64, "64"], [256, "256"], [1024, "1024"]], st.S, (v) => { st.S = v; desenhar(); },
      "O limiar S do contador aproximado. A linha tracejada é sempre o contador exato, com um lock só.");
    const atraso = h("div", "atraso-custo");
    atraso.dataset.ajuda = "O maior atraso possível do global com 8 threads: cada local pode guardar até S − 1 incrementos ainda não transferidos.";
    lado.append(op.el, atraso);
    sim.append(lado);

    function serie(vals, cls, rotulo) {
      const g = document.createElementNS(ns, "g");
      g.setAttribute("class", "serie " + cls);
      const pts = vals.map((v, i) => `${px(i)},${py(v)}`).join(" ");
      const pl = document.createElementNS(ns, "polyline");
      pl.setAttribute("points", pts);
      g.append(pl);
      vals.forEach((v, i) => {
        const c = document.createElementNS(ns, cls === "exato" ? "rect" : "circle");
        if (cls === "exato") { c.setAttribute("x", px(i) - 9); c.setAttribute("y", py(v) - 9); c.setAttribute("width", 18); c.setAttribute("height", 18); }
        else { c.setAttribute("cx", px(i)); c.setAttribute("cy", py(v)); c.setAttribute("r", 10); }
        const t = document.createElementNS(ns, "title");
        t.textContent = `${rotulo}, ${THREADS[i]} thread${i ? "s" : ""}: ${num(v, 3)} s`;
        c.append(t);
        g.append(c);
      });
      const tx = document.createElementNS(ns, "text");
      tx.setAttribute("x", px(3) + 24); tx.setAttribute("y", py(vals[3]) + 10);
      tx.setAttribute("class", "rot-serie");
      tx.textContent = rotulo;
      g.append(tx);
      camada.append(g);
    }
    function desenhar() {
      camada.replaceChildren();
      serie(MEDIDAS[0], "exato", "exato");
      serie(MEDIDAS[st.S], "aprox", `S = ${st.S}`);
      atraso.innerHTML = `<span class="cab">atraso máximo, 8 threads</span><b>${(8 * (st.S - 1)).toLocaleString("pt-BR")}</b>`;
    }
    desenhar();
  };

  /* ---------- Um lock ou muitos? (cap. 29.4) ----------
     Threads fazem inserções numa tabela hash: cada operação sorteia um bucket, pega o lock (da tabela ou do
     bucket), fica 2 ticks com ele e passa 2 ticks fora da tabela (calculando o hash, preparando o nó). */
  function simularHash({ T, B, porBucket, ticks, semente = 5, D = 2, FORA = 2 }) {
    const aleat = gerador(semente);
    const th = Array.from({ length: T }, () => ({ fase: "fora", resta: 1 + Math.floor(aleat() * FORA), b: 0 }));
    const dono = new Map();
    let ops = 0, esperando = 0;
    const quadros = [];
    for (let t = 0; t < ticks; t++) {
      const ordem = th.map((_, i) => i).sort(() => aleat() - 0.5);
      for (const i of ordem) {
        const x = th[i];
        const chave = porBucket ? x.b : 0;
        if (x.fase === "fora") { if (--x.resta === 0) { x.fase = "quer"; x.b = Math.floor(aleat() * B); } }
        else if (x.fase === "quer") {
          const k = porBucket ? x.b : 0;
          if (!dono.has(k)) { dono.set(k, i); x.fase = "dentro"; x.resta = D; }
          else esperando++;
        } else if (x.fase === "dentro") {
          if (--x.resta === 0) { dono.delete(chave); ops++; x.fase = "fora"; x.resta = FORA; }
        }
      }
      quadros.push(th.map((x) => ({ fase: x.fase, b: x.b })));
    }
    return { quadros, vazao: ops / ticks, esperando: esperando / (ticks * T) };
  }
  SIMS.hash = function (sim) {
    const st = { T: 8, B: 16, porBucket: false, quadro: 0 };
    titulo(sim, "Um lock ou muitos?");
    const ctl = pos(h("div", "ctl-linha"), 120, 160);
    const opModo = opcoes("", [[false, "um lock"], [true, "um por bucket"]], st.porBucket, (v) => { st.porBucket = v; recalcular(); },
      "Um lock para a tabela inteira, ou um lock em cada bucket.");
    const ctB = controle("buckets", { min: 0, max: 6, valor: 4, fmt: (v) => String(2 ** v) }, (v) => { st.B = 2 ** v; recalcular(); }, "Quantos buckets a tabela tem.");
    const ctT = controle("threads", { min: 1, max: 8, valor: st.T }, (v) => { st.T = v; recalcular(); }, "Quantas threads fazem inserções ao mesmo tempo.");
    ctB.el.style.width = ctT.el.style.width = "240px";
    ctl.append(opModo.el, ctB.el, ctT.el);
    sim.append(ctl);

    const tabela = pos(h("div", "tabela-hash"), 120, 260, 820);
    tabela.dataset.ajuda = "Os buckets da tabela. Roxo: alguém está inserindo nele. Contorno coral: há threads esperando o lock.";
    sim.append(tabela);
    const threads = pos(h("div", "threads-hash"), 1000, 260, 480);
    threads.dataset.ajuda = "As threads. Verde: fora da tabela, preparando a próxima inserção. Roxo: inserindo. Coral: esperando um lock.";
    sim.append(threads);
    const numeros = pos(h("div", "numeros-hash"), 1000, 560, 480);
    numeros.dataset.ajuda = "Médias de 2.000 ticks com a configuração atual: inserções completadas por tick e a fração do tempo que as threads passam esperando um lock.";
    sim.append(numeros);
    let relogio = null;
    const bTocar = icone("tocar", "animar", "Anima a tabela, um tick por vez.", () => alternar());
    ctl.append(bTocar);

    function recalcular() {
      st.anim = simularHash({ T: st.T, B: st.B, porBucket: st.porBucket, ticks: 400 });
      st.medio = simularHash({ T: st.T, B: st.B, porBucket: st.porBucket, ticks: 2000, semente: 11 });
      st.quadro = 0;
      desenhar();
    }
    function alternar() {
      if (relogio) { clearInterval(relogio); relogio = null; }
      else relogio = setInterval(() => { st.quadro = (st.quadro + 1) % st.anim.quadros.length; desenhar(); }, 500);
      bTocar.querySelector("svg").innerHTML = relogio ? ICONES.pausar : ICONES.tocar;
    }
    function desenhar() {
      const q = st.anim.quadros[st.quadro];
      /* uma thread que quer o lock só está esperando se alguém o segura: o do bucket dela, ou o da tabela */
      const bloqueada = (i) => q.some((x, j) => j !== i && x.fase === "dentro" && (!st.porBucket || x.b === q[i].b));
      const lado = st.B <= 16 ? 4 : 8;
      const tam = Math.floor((820 - (lado - 1) * 10) / lado);
      const alt = Math.min(tam, 60);
      tabela.style.gridTemplateColumns = `repeat(${lado}, ${tam}px)`;
      tabela.replaceChildren(...Array.from({ length: st.B }, (_, b) => {
        const d = h("div", "bucket");
        d.style.height = alt + "px";
        const ocupado = q.some((x) => x.fase === "dentro" && x.b === b);
        const espera = q.some((x, i) => x.fase === "quer" && x.b === b && bloqueada(i));
        d.classList.toggle("ocupado", ocupado);
        d.classList.toggle("espera", espera);
        return d;
      }));
      threads.replaceChildren(...q.map((x, i) => h("span", "chip-t " + (x.fase === "quer" ? (bloqueada(i) ? "quer" : "fora") : x.fase), "T" + (i + 1))));
      numeros.innerHTML = `<p><span class="cab">inserções por tick</span><b>${num(st.medio.vazao, 2)}</b></p>` +
        `<p><span class="cab">tempo esperando lock</span><b>${Math.round(100 * st.medio.esperando)}%</b></p>`;
    }
    recalcular();
  };

  /* ---------- Placar dos locks: fonte única, cada slide mostra as linhas até data-ate ---------- */
  const PLACAR = [
    ["desligar interrupções", ["só com 1 CPU", "ruim"], ["–", ""], ["ok", "bom"], ["não serve", "ruim"]],
    ["flag na memória", ["não", "ruim"], ["não", "ruim"], ["gira", "ruim"], ["gira", "ruim"]],
    ["test-and-set", ["sim", "bom"], ["não", "ruim"], ["gira o quantum", "ruim"], ["ok se curta", "bom"]],
    ["ticket (fetch-and-add)", ["sim", "bom"], ["sim", "bom"], ["gira o quantum", "ruim"], ["ok se curta", "bom"]],
    ["test-and-set + yield", ["sim", "bom"], ["não", "ruim"], ["N trocas", ""], ["N trocas", ""]],
    ["fila (park e unpark)", ["sim", "bom"], ["sim", "bom"], ["dorme", "bom"], ["troca cara", ""]],
    ["duas fases (futex)", ["sim", "bom"], ["sim", "bom"], ["dorme", "bom"], ["gira e dorme", "bom"]],
  ];
  document.querySelectorAll(".slide.placar").forEach((sec) => {
    const ate = parseInt(sec.dataset.ate, 10);
    const tb = h("table", "tab-placar");
    tb.innerHTML = "<tr><th></th><th>exclusão mútua</th><th>justiça</th><th>1 CPU</th><th>várias CPUs</th></tr>" +
      PLACAR.map(([nome, ...cs], i) => `<tr class="${i < ate ? (i === ate - 1 ? "novo" : "") : "futuro"}"><td>${nome}</td>` +
        cs.map(([t, c]) => `<td><span class="${c}">${i < ate ? t : ""}</span></td>`).join("") + "</tr>").join("");
    sec.querySelector(".lugar-placar").append(tb);
  });

  /* ---------- Questões (questoes.js): o aluno escolhe uma alternativa e revela a resposta ---------- */
  document.querySelectorAll(".slide[data-q]").forEach((sec) => {
    const n = parseInt(sec.dataset.q, 10);
    const q = window.QUESTOES[n - 1];
    const esq = h("div", "q-esq");
    esq.append(h("p", "rotulo-termo q-rot", `Questão ${n} · parte ${q.parte}`));
    const en = h("p", "q-enunciado"); en.innerHTML = marcar(q.enunciado);
    esq.append(en);
    if (q.codigo) {
      const cods = h("div", "q-codigos");
      q.codigo.forEach((c) => {
        const bl = h("div", "q-cod");
        if (c.titulo) bl.append(h("span", "cab", c.titulo));
        bl.append(h("pre", "objeto cod", c.texto));
        cods.append(bl);
      });
      esq.append(cods);
    }
    const dir = h("div", "q-dir");
    const cmd = h("p", "q-comando"); cmd.innerHTML = marcar(q.comando);
    dir.append(cmd);
    let escolhida = null;
    const bs = q.alt.map((a, i) => {
      const b = h("button", "q-alt");
      b.append(h("span", "letra", "ABCD"[i]), h("span", "txt", a));
      b.addEventListener("click", () => { escolhida = i; sec.classList.remove("revelada"); marcarEscolha(); });
      dir.append(b);
      return b;
    });
    const rodape = h("div", "q-rodape");
    const resultado = h("span", "q-resultado");
    const bRevelar = icone("olho", "revelar a resposta", "", () => { sec.classList.toggle("revelada"); marcarEscolha(); });
    rodape.append(bRevelar, resultado);
    dir.append(rodape);
    function marcarEscolha() {
      const rev = sec.classList.contains("revelada");
      bs.forEach((b, i) => {
        b.classList.toggle("escolhida", i === escolhida);
        b.classList.toggle("certa", rev && i === q.gab);
        b.classList.toggle("errada", rev && i === escolhida && i !== q.gab);
      });
      resultado.textContent = !rev ? (escolhida === null ? "escolha uma alternativa" : "") :
        escolhida === null ? `resposta: ${"ABCD"[q.gab]}` : escolhida === q.gab ? "acertou!" : `resposta: ${"ABCD"[q.gab]}`;
    }
    marcarEscolha();
    const notas = h("aside", "notas", `Resposta: ${"ABCD"[q.gab]} (${q.dif}). ${q.just.join(" ")}`);
    sec.append(esq, dir, notas);
  });

  /* ---------- Ajuda: toda sigla é explicada no próprio balão ---------- */
  const SIGLAS = {
    FAA: "fetch-and-add, soma atômica que devolve o valor antigo",
    TAS: "test-and-set, troca atômica que devolve o valor antigo",
    CPU: "central processing unit, o processador",
    CPUs: "central processing units, os processadores",
  };
  window.notasAjuda = (texto) => Object.entries(SIGLAS)
    .map(([s, sig]) => [s, sig, texto.search(new RegExp(`\\b${s}\\b`))])
    .filter(([, , i]) => i >= 0)
    .sort((a, b) => a[2] - b[2])
    .filter(([s], i, arr) => !(s === "CPU" && arr.some(([x]) => x === "CPUs")))
    .map(([s, sig]) => [s, sig]);

  /* ---------- montagem ---------- */
  document.querySelectorAll(".sim[data-sim]").forEach((sim) => {
    const f = SIMS[sim.dataset.sim];
    try { if (f) f(sim, sim.closest(".slide")); }
    catch (erro) { console.error(erro); setTimeout(() => { throw erro; }); }
  });
})();
