/* Simulador da aula de introdução à concorrência (OSTEP, cap. 26).
   Cada <div class="sim" data-sim="..."> é montado aqui, em coordenadas da tela de 1600 × 900. */
(function () {
  function h(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }
  function pos(e, x, y, w) {
    e.style.left = x + "px"; e.style.top = y + "px";
    if (w != null) e.style.width = w + "px";
    return e;
  }
  const ICONES = {
    reiniciar: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4 4v5h5"/>',
    passo: '<path d="M4 15a8 8 0 0 1 15.5-2.8"/><path d="M20 7v6h-6"/><circle cx="12" cy="19.5" r="1.8" fill="currentColor"/>',
  };
  function icone(nome, titulo, ajuda, f) {
    const b = h("button", "icone");
    b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${ICONES[nome]}</svg>`;
    b.title = titulo; b.dataset.ajuda = ajuda;
    b.addEventListener("click", f);
    return b;
  }

  const SIMS = {};

  /* ---------- A corrida da figura 26.7 ----------
     O counter começa em 50 e cada thread executa uma vez as três instruções de counter = counter + 1.
     A turma é o escalonador: o botão de cada thread (step over) roda a próxima instrução dela. */
  SIMS.corrida = function (sim) {
    const INS = [
      { end: "100", txt: "mov 0x8049a1c, %eax", curto: "mov" },
      { end: "105", txt: "add $0x1, %eax", curto: "add" },
      { end: "108", txt: "mov %eax, 0x8049a1c", curto: "mov" },
    ];
    const st = {};

    sim.append(pos(h("h2", "titulo", "Quem executa agora?"), 120, 56));
    sim.append(pos(h("p", "rotulo-termo", "Seção crítica"), 120, 146));

    const paineis = [0, 1].map((i) => {
      const p = pos(h("div", "thr"), 120 + i * 580, 190, 500);
      const cab = h("div", "cab-thr");
      const estado = h("span", "estado");
      cab.append(h("span", "nome", `Thread ${i + 1}`), estado);
      const secao = h("div", "secao");
      if (i === 0) secao.dataset.ajuda = "A seção crítica: as três instruções que leem e gravam o counter, que as duas threads compartilham.";
      const linhas = INS.map((ins) => {
        const l = h("div", "ins");
        l.append(h("span", "end", ins.end), h("span", "", ins.txt));
        secao.append(l);
        return l;
      });
      const regs = h("div", "regs");
      const eax = h("span", "chip");
      regs.append(h("span", "", "eax"), eax);
      if (i === 0) regs.dataset.ajuda = "O registrador eax desta thread. Cada thread tem o seu: quando ela sai da CPU, o SO guarda o valor no TCB.";
      const acoes = h("div", "acoes");
      const bExec = icone("passo", `próxima instrução da thread ${i + 1}`,
        `Roda a próxima instrução da thread ${i + 1}. Se a CPU estava com a outra thread, acontece uma troca de contexto.`, () => executar(i));
      acoes.append(bExec);
      p.append(cab, secao, regs, acoes);
      sim.append(p);
      return { p, estado, linhas, eax, bExec };
    });

    const mem = pos(h("div", "mem"), 1290, 190, 220);
    const valor = h("span", "valor");
    mem.append(h("span", "cab", "counter"), valor, h("span", "cab", "0x8049a1c"));
    mem.dataset.ajuda = "O counter na memória, no endereço 0x8049a1c, compartilhado pelas duas threads. Começa em 50; o certo, depois das duas, é 52.";
    sim.append(mem);
    const resultado = pos(h("div", "resultado"), 1290, 440, 250);
    sim.append(resultado);

    const trilha = pos(h("div", "trilha"), 120, 640, 1130);
    trilha.dataset.ajuda = "A ordem em que as instruções rodaram. Cada troca marca uma troca de contexto entre as threads.";
    sim.append(trilha);

    const rodape = pos(h("div", "rodape-sim"), 120, 740);
    const bZerar = icone("reiniciar", "recomeçar", "Recomeça, com o counter em 50.", zerar);
    rodape.append(bZerar);
    sim.append(rodape);

    function zerar() {
      Object.assign(st, { mem: 50, mudou: false, rodando: null, t: [{ pc: 0, eax: 0 }, { pc: 0, eax: 0 }], trilha: [] });
      desenhar();
    }
    function passo(i) {
      const t = st.t[i];
      if (t.pc === 0) t.eax = st.mem;
      else if (t.pc === 1) t.eax += 1;
      else { st.mem = t.eax; st.mudou = true; }
      st.trilha.push({ i, txt: INS[t.pc].curto });
      t.pc += 1;
    }
    function executar(i) {
      const t = st.t[i];
      if (t.pc === 3) return;
      if (st.rodando !== null && st.rodando !== i) st.trilha.push({ troca: true });
      st.rodando = i;
      st.mudou = false;
      passo(i);
      desenhar();
    }

    function desenhar() {
      paineis.forEach((pn, i) => {
        const t = st.t[i];
        pn.p.classList.toggle("rodando", st.rodando === i);
        pn.estado.textContent = t.pc === 3 ? "terminou" : st.rodando === i ? "na CPU" : "pronta";
        pn.linhas.forEach((l, k) => { l.classList.toggle("feita", k < t.pc); l.classList.toggle("proxima", k === t.pc); });
        pn.eax.textContent = String(t.eax);
        pn.bExec.disabled = t.pc === 3;
      });
      valor.textContent = String(st.mem);
      valor.classList.toggle("mudou", st.mudou);
      trilha.replaceChildren(h("span", "rot-trilha", "ordem"));
      st.trilha.forEach((ev) => trilha.append(ev.troca ? h("span", "ev interrupcao", "troca") : h("span", `ev t${ev.i + 1}`, `T${ev.i + 1} ${ev.txt}`)));
      const fim = st.t.every((t) => t.pc === 3);
      resultado.replaceChildren();
      if (fim && st.mem === 52) {
        resultado.append(h("p", "", "52: as duas somas contaram."));
      } else if (fim) {
        resultado.append(h("p", "ruim", `${st.mem}: uma soma se perdeu.`), h("p", "rotulo-termo", "Race condition"));
      }
      resultado.querySelectorAll(".rotulo-termo").forEach((r) => { r.style.position = "static"; r.style.marginTop = "16px"; });
    }
    zerar();
  };

  /* Chama fn(estado) agora e a cada mudança de passo do slide (data-estado, posto pelo deck.js). */
  function aoMudarPasso(sec, fn) {
    const ler = () => fn(parseInt(sec.dataset.estado || "0", 10));
    new MutationObserver(ler).observe(sec, { attributes: true, attributeFilter: ["data-estado"] });
    ler();
  }

  /* ---------- Troca de contexto: entre processos (passos 0 a 2) e entre threads (passos 3 a 5) ----------
     A CPU mostra os registradores (com o PTBR, que aponta a tabela de páginas) e a TLB. Entre processos,
     o PTBR muda e a TLB é esvaziada; entre threads do mesmo processo, o PTBR e a TLB ficam. */
  SIMS.troca = function (sim, sec) {
    const REGS = ["PC", "SP", "eax", "PTBR"];
    const A = { PC: "0x4010", SP: "0x7f80", eax: "12", PTBR: "0x2000" };
    const B = { PC: "0x1a24", SP: "0x7f20", eax: "3", PTBR: "0x5000" };
    const T2 = { PC: "0x4130", SP: "0x5f80", eax: "5", PTBR: "0x2000" };
    const TLB_A = [["0", "7"], ["1", "3"], ["15", "9"]];
    const TLB_VAZIA = [["—", "—"], ["—", "—"], ["—", "—"]];
    const P = { esq: ["Processo A", "PCB"], dir: ["Processo B", "PCB"] };
    const T = { esq: ["Thread T1", "TCB"], dir: ["Thread T2", "TCB"] };
    const todos = REGS;
    const ESTADOS = [
      { lados: P, esq: null, dir: B, cpu: A, quem: "A", tlb: TLB_A, leg: "Processo A na CPU." },
      { lados: P, esq: A, dir: B, cpu: A, quem: "A", tlb: TLB_A, seta: "salva", mEsq: todos, leg: "Troca para B: o SO salva os registradores de A no PCB." },
      { lados: P, esq: A, dir: B, cpu: B, quem: "B", tlb: TLB_VAZIA, seta: "restaura", mCpu: todos, tlbM: "mudou", leg: "Restaura B: o PTBR muda e a <b>TLB é esvaziada</b>." },
      { lados: T, esq: null, dir: T2, cpu: A, quem: "T1", tlb: TLB_A, leg: "Duas threads do mesmo processo. T1 na CPU." },
      { lados: T, esq: A, dir: T2, cpu: A, quem: "T1", tlb: TLB_A, seta: "salva", mEsq: todos, leg: "Troca para T2: o SO salva os registradores de T1 no TCB." },
      { lados: T, esq: A, dir: T2, cpu: T2, quem: "T2", tlb: TLB_A, seta: "restaura", mCpu: ["PC", "SP", "eax"], iCpu: ["PTBR"], tlbM: "igual", leg: "Restaura T2: mesmo PTBR, <b class=\"bom\">a TLB continua valendo</b>." },
    ];

    const tabela = (linhas) => {
      const tb = h("table");
      const tds = linhas.map(([a]) => {
        const tr = h("tr"); const c1 = h("td", "", a); const c2 = h("td");
        tr.append(c1, c2); tb.append(tr); return [c1, c2];
      });
      return { tb, tds };
    };
    const bloco = (x) => {
      const el = pos(h("div", "bloco-ctl"), x, 180, 320);
      const nome = h("span", "nome"); const tipo = h("span", "tipo");
      const tab = tabela(REGS.map((r) => [r]));
      el.append(nome, tipo, tab.tb);
      sim.append(el);
      return { nome, tipo, tds: tab.tds };
    };
    const esq = bloco(120);
    const dir = bloco(1110);
    const cpu = pos(h("div", "cpu"), 560, 180, 440);
    const cpuNome = h("div", "nome"); const cpuQuem = h("span");
    cpuNome.append(document.createTextNode("CPU"), cpuQuem);
    const regs = tabela(REGS.map((r) => [r]));
    const tlb = tabela([["", ""], ["", ""], ["", ""]]);
    cpu.append(cpuNome, h("span", "sub", "registradores"), regs.tb, h("span", "sub", "TLB · VPN → PFN"), tlb.tb);
    sim.append(cpu);
    const setaSalva = pos(h("span", "seta-ctl", "←"), 500, 330);
    const setaRestaura = pos(h("span", "seta-ctl", "←"), 1048, 330);
    const legenda = pos(h("p", "legenda-troca"), 120, 790, 1360);
    sim.append(setaSalva, setaRestaura, legenda);

    const preencher = (tds, valores, mudou = [], igual = []) => tds.forEach(([c1, c2], k) => {
      const r = REGS[k];
      c2.textContent = valores ? valores[r] : "—";
      c2.className = !valores ? "vazio" : mudou.includes(r) ? "mudou" : igual.includes(r) ? "igual" : "";
    });
    aoMudarPasso(sec, (k) => {
      const e = ESTADOS[Math.min(k, ESTADOS.length - 1)];
      [[esq, e.lados.esq], [dir, e.lados.dir]].forEach(([b, [n, tp]]) => { b.nome.textContent = n; b.tipo.textContent = tp; });
      preencher(esq.tds, e.esq, e.mEsq || []);
      preencher(dir.tds, e.dir);
      preencher(regs.tds, e.cpu, e.mCpu || [], e.iCpu || []);
      cpuQuem.textContent = "rodando " + e.quem;
      tlb.tds.forEach(([c1, c2], i) => {
        c1.textContent = e.tlb[i][0]; c2.textContent = e.tlb[i][1];
        c1.className = c2.className = e.tlbM || "";
      });
      setaSalva.style.visibility = e.seta === "salva" ? "visible" : "hidden";
      setaRestaura.style.visibility = e.seta === "restaura" ? "visible" : "hidden";
      legenda.innerHTML = e.leg;
    });
  };

  /* Ajuda: toda sigla é explicada no próprio balão, numa nota de rodapé. */
  const SIGLAS = {
    TCB: "thread control block, onde o SO guarda o estado de uma thread",
    SO: "sistema operacional",
    PCB: "process control block, onde o SO guarda o estado de um processo",
    PTBR: "page-table base register, o endereço da tabela de páginas",
    TLB: "translation lookaside buffer, um cache de traduções de endereço",
    OSTEP: "Operating Systems: Three Easy Pieces, o livro da disciplina",
  };
  window.notasAjuda = (texto) => Object.entries(SIGLAS)
    .map(([s, sig]) => [s, sig, texto.search(new RegExp(`\\b${s}\\b`))])
    .filter(([, , i]) => i >= 0)
    .sort((a, b) => a[2] - b[2])
    .map(([s, sig]) => [s, sig]);

  document.querySelectorAll(".sim[data-sim]").forEach((sim) => {
    const f = SIMS[sim.dataset.sim];
    try { if (f) f(sim, sim.closest(".slide")); }
    catch (erro) { console.error(erro); setTimeout(() => { throw erro; }); }
  });
})();
