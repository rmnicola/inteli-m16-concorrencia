/* Simuladores da aula de locks (OSTEP, cap. 28).
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

  /* ---------- Cronômetro dos momentos de exploração ----------
     data-min define os minutos. ▶ inicia e pausa, ↺ volta ao tempo definido, −1 e +1 ajustam. */
  SIMS.cronometro = function (sim) {
    const st = { minutos: parseInt(sim.dataset.min || "15", 10), relogio: null };
    st.resta = st.minutos * 60;
    const caixa = h("div", "cronometro");
    const visor = h("div", "visor");
    const acoes = h("div", "acoes-cron");
    const bTocar = icone("tocar", "iniciar ou pausar", "", () => alternar());
    const bZerar = icone("reiniciar", "voltar ao tempo definido", "", () => { parar(); st.resta = st.minutos * 60; mostrar(); });
    const ajuste = (txt, d) => { const b = h("button", "ajuste", txt); b.addEventListener("click", () => { st.resta = Math.max(0, st.resta + d * 60); mostrar(); }); return b; };
    acoes.append(bTocar, bZerar, ajuste("−1", -1), ajuste("+1", 1));
    caixa.append(h("span", "cab", "tempo"), visor, acoes);
    sim.append(caixa);
    function mostrar() {
      const m = Math.floor(st.resta / 60), s = st.resta % 60;
      visor.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      visor.classList.toggle("fim", st.resta === 0);
      bTocar.querySelector("svg").innerHTML = st.relogio ? ICONES.pausar : ICONES.tocar;
    }
    function parar() { clearInterval(st.relogio); st.relogio = null; }
    function alternar() {
      if (st.relogio) parar();
      else if (st.resta > 0) st.relogio = setInterval(() => { st.resta = Math.max(0, st.resta - 1); if (!st.resta) parar(); mostrar(); }, 1000);
      mostrar();
    }
    mostrar();
  };

  /* ---------- Placar dos locks: fonte única, cada slide mostra as linhas até data-ate ---------- */
  const PLACAR = [
    ["flag na memória", ["não", "ruim"], ["não", "ruim"], ["gira", "ruim"], ["gira", "ruim"]],
    ["desligar interrupções", ["só com 1 CPU", "ruim"], ["–", ""], ["ok", "bom"], ["não serve", "ruim"]],
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
    esq.append(h("p", "rotulo-termo q-rot", `Questão ${n} · bloco ${q.bloco}`));
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
