/* Questões objetivas da aula de locks (OSTEP, cap. 28), no modelo do ENADE: enunciado contextualizado e quatro alternativas,
   uma só correta. Fonte única dos slides de questão (deck.html) e do gabarito comentado (guias/gabarito.json).
   Marcação: **negrito** e `código`. "codigo" é uma lista de blocos {titulo?, texto} mostrados ao lado do enunciado.
   "just": a primeira linha explica a certa; as outras, o erro por trás de cada alternativa errada. */
window.QUESTOES = [
  {
    bloco: 1, dif: "fácil",
    enunciado: "Para proteger um contador de pacotes num gateway de **dois núcleos**, um desenvolvedor escreveu o próprio lock, com uma variável **flag**. Nos testes, o contador às vezes termina **menor** que o esperado.",
    codigo: [{ texto: `void lock(lock_t *m) {
    while (m->flag == 1)
        ;          // gira
    m->flag = 1;
}

void unlock(lock_t *m) {
    m->flag = 0;
}` }],
    comando: "Qual é a causa do problema?",
    alt: [
      "A espera girando impede a dona do lock de voltar a executar.",
      "Testar o flag e escrever 1 são operações separadas: entre elas, outra thread também vê 0, e as duas entram.",
      "O unlock não confere quem é o dono, e outra thread libera o lock.",
      "Falta declarar flag como volatile; com isso, o lock funcionaria.",
    ],
    gab: 1,
    just: [
      "É a falha da fig. 28.2 do OSTEP. Entre ler flag == 0 e escrever flag = 1 há uma janela: duas threads podem ler 0 antes de qualquer uma escrever 1, e as duas entram na seção crítica. Com as duas atualizando o contador ao mesmo tempo, incrementos se perdem.",
      "(A) Girar desperdiça CPU, mas não perde incrementos: com dois núcleos a dona roda no outro, e com um núcleo só a interrupção do timer tira a CPU de quem gira.",
      "(C) É verdade que esse unlock não confere o dono, mas no programa só quem tem o lock chama unlock; isso não explica incrementos perdidos.",
      "(D) volatile obriga a reler a memória, mas não junta o teste e a escrita numa operação só: a janela continua lá.",
    ],
  },
  {
    bloco: 2, dif: "fácil",
    enunciado: "Num sistema de **um núcleo**, o kernel protegia as seções críticas **desligando as interrupções** na entrada e religando na saída. A equipe quer usar a mesma técnica como lock das threads de um aplicativo, num servidor de **16 núcleos**.",
    comando: "Por que essa técnica não serve como lock nesse servidor?",
    alt: [
      "Só impede trocas de contexto no núcleo que a executou, e um aplicativo nem pode usá-la: a instrução é privilegiada.",
      "Com as interrupções desligadas, a própria thread não consegue acessar a memória.",
      "Ela protege só as variáveis da pilha da thread, e não as do heap.",
      "Ela garante a exclusão mútua com 16 núcleos, mas não é justa.",
    ],
    gab: 0,
    just: [
      "Seção 28.5 do OSTEP. Com um núcleo, sem interrupção não há troca de contexto, e a seção crítica roda inteira. Com vários núcleos, cada um tem as próprias interrupções: desligá-las num núcleo não para os outros. E um aplicativo não pode desligar interrupções, senão poderia monopolizar a máquina.",
      "(B) Desligar interrupções não afeta os acessos à memória da própria thread.",
      "(C) Interrupções não têm relação com a região da memória; a pilha nem é o que as threads compartilham.",
      "(D) Com vários núcleos, a técnica não garante nem a exclusão mútua, o requisito mais básico.",
    ],
  },
  {
    bloco: 2, dif: "média",
    enunciado: "Num servidor de jogos, um **spin lock com test-and-set** protege o placar. No pico, algumas threads ficam muito tempo sem conseguir o lock. A equipe o troca por um **ticket lock**.",
    codigo: [{ texto: `void lock(lock_t *l) {
    int eu = FetchAndAdd(&l->ticket);
    while (l->turn != eu)
        ;          // gira
}

void unlock(lock_t *l) {
    l->turn = l->turn + 1;
}` }],
    comando: "O que o ticket lock melhora em relação ao test-and-set?",
    alt: [
      "A correção: com test-and-set, duas threads podiam entrar juntas.",
      "O desempenho com uma CPU: quem espera deixa de girar.",
      "A justiça: as threads entram na ordem em que pegaram o número.",
      "O desempenho com várias CPUs: o fetch-and-add elimina a espera ocupada.",
    ],
    gab: 2,
    just: [
      "Seções 28.8 e 28.11. Com test-and-set, pega o lock quem executa a instrução na hora certa, e uma thread pode perder sempre. No ticket lock, turn chama os números em ordem: toda thread que pegou um número entra depois das que pegaram antes.",
      "(A) O spin lock com test-and-set já é correto: a instrução é atômica.",
      "(B) O ticket lock continua girando no while; para não gastar CPU é preciso ceder (yield) ou dormir.",
      "(D) Quem espera no ticket lock lê turn sem parar: a espera ocupada continua.",
    ],
  },
  {
    bloco: 3, dif: "média",
    enunciado: "Um banco de dados em memória roda em **32 núcleos**. As seções críticas duram cerca de **100 ns**, e pôr uma thread para dormir e acordá-la custa cerca de **5 µs**. Às vezes, a dona do lock perde a CPU no meio da seção crítica e só volta milissegundos depois.",
    comando: "Qual estratégia de espera é a mais adequada?",
    alt: [
      "Dormir numa fila assim que encontrar o lock ocupado.",
      "Girar um pouco e, se o lock não for liberado, dormir numa fila: um lock em duas fases.",
      "Girar sempre: com 32 núcleos, a dona do lock está sempre rodando.",
      "Desligar as interrupções durante a seção crítica.",
    ],
    gab: 1,
    just: [
      "Seção 28.16. No caso comum, o lock é liberado em cerca de 100 ns, e girar um pouco resolve sem pagar as trocas de contexto. No caso raro, a dona perdeu a CPU, e girar por milissegundos desperdiçaria um núcleo: aí vale dormir. É a ideia do futex no Linux.",
      "(A) Paga 5 µs para esperar uma seção crítica de 100 ns, 50 vezes mais.",
      "(C) O enunciado diz que a dona às vezes perde a CPU; aí quem gira gasta milissegundos de um núcleo sem fazer nada.",
      "(D) Não funciona com vários núcleos e é privilegiada.",
    ],
  },
  {
    bloco: 3, dif: "difícil",
    enunciado: "Quatro threads disputam um lock em **uma CPU**, em rodízio com **quantum de 10 ms**; cada troca de contexto custa **0,1 ms**. T1 pega o lock e perde a CPU na seção crítica; depois rodam T2, T3, T4 e T1. Compare: **(1)** girar com test-and-set até o fim do quantum; **(2)** tentar uma vez e **ceder a CPU** com yield. Ignore o tempo das instruções que testam o lock.",
    comando: "Quanto tempo passa até T1 voltar, em (1) e em (2)?",
    alt: ["10,1 ms e 0,1 ms", "40,4 ms e 0,4 ms", "30,4 ms e 30,4 ms", "30,4 ms e 0,4 ms"],
    gab: 3,
    just: [
      "Há 4 trocas de contexto nos dois casos (T1→T2, T2→T3, T3→T4, T4→T1): 0,4 ms. Girando, T2, T3 e T4 gastam o quantum inteiro: 3 × 10 + 0,4 = 30,4 ms. Com yield, cada uma cede a CPU na primeira tentativa: só as trocas, 0,4 ms. Com N threads, girar desperdiça N − 1 quanta; o yield reduz isso a N − 1 trocas, que ainda crescem com N e não impedem uma thread de esperar para sempre. Daí a fila (seção 28.14).",
      "(A) Conta só a espera de T2.",
      "(B) Conta um quantum para cada uma das quatro threads, inclusive T1, a dona do lock.",
      "(C) Supõe que o yield não muda nada; ele devolve a CPU antes do fim do quantum.",
    ],
  },
  {
    bloco: 4, dif: "fácil",
    enunciado: "Duas threads rodam o **flag.s** no x86.py, uma passada cada, com **interrupção a cada 3 instruções**. A thread 0 começa. A segunda coluna mostra o que cada thread executou em cada turno.",
    codigo: [
      { titulo: "flag.s", texto: `1000 mov  flag, %ax
1001 test $0, %ax
1002 jne  .acquire
1003 mov  $1, flag
1004 mov  count, %ax
1005 add  $1, %ax
1006 mov  %ax, count
1007 mov  $0, flag
1008 sub  $1, %bx
1009 test $0, %bx
1010 jgt  .top
1011 halt` },
      { titulo: "turnos", texto: `T0  1000–1002
T1  1000–1002
T0  1003–1005
T1  1003–1005
T0  1006–1008
T1  1006–1008
T0  1009–1011
T1  1009–1011` },
    ],
    comando: "Quanto vale count no fim, e o que aconteceu?",
    alt: [
      "2; o flag impediu que as duas threads estivessem juntas na seção crítica.",
      "1; a thread 1 girou em .acquire até a thread 0 liberar o flag.",
      "1; as duas threads entraram na seção crítica, porque ambas leram flag = 0.",
      "0; as duas escritas em count se anularam.",
    ],
    gab: 2,
    just: [
      "A thread 0 lê flag = 0 (1000) e é interrompida; a thread 1 também lê 0. As duas escrevem 1 no flag (1003) e leem count = 0 (1004). A thread 0 escreve 1 em count (1006), e a thread 1, que já tinha somado 1 a 0 no próprio %ax, escreve 1 por cima. Resultado: 1, com as duas threads na seção crítica ao mesmo tempo. Para conferir: python3 x86.py -p flag.s -t 2 -a bx=1,bx=1 -i 3 -M flag,count -c.",
      "(A) O flag não impede nada aqui: o teste (1000 a 1002) e a escrita (1003) ficaram em turnos diferentes.",
      "(B) A thread 1 nunca voltou a .acquire: o jne dela não desviou, porque ela leu 0.",
      "(D) Cada thread escreve 1 (0 + 1, no próprio registrador); uma escrita sobrescreve a outra, mas nenhuma zera o contador.",
    ],
  },
  {
    bloco: 4, dif: "fácil",
    enunciado: "No **test-and-set.s**, a aquisição do lock é o trecho ao lado. Rodando com `-M mutex -R ax -c`, um estudante vê **%ax = 1** logo depois de um xchg.",
    codigo: [{ titulo: "test-and-set.s", texto: `.acquire
mov  $1, %ax
xchg %ax, mutex   # troca atômica
test $0, %ax      # veio 0? livre!
jne  .acquire     # se não, de novo` }],
    comando: "O que isso indica?",
    alt: [
      "O lock já estava ocupado: o xchg devolveu o valor antigo, 1, e a thread volta para .acquire.",
      "A thread conseguiu o lock, porque o xchg escreveu 1 em mutex.",
      "O xchg foi interrompido no meio e precisa ser repetido.",
      "O lock estava livre, e mutex passou a valer 0.",
    ],
    gab: 0,
    just: [
      "O xchg troca, de forma atômica, %ax (1) com mutex e deixa em %ax o valor antigo. Veio 1: o lock já era de outra thread, e mutex continua 1. Se viesse 0, o lock estava livre e agora é desta thread.",
      "(B) Quem decide é o valor antigo, que voltou em %ax; o xchg sempre escreve 1.",
      "(C) O xchg é atômico: uma interrupção acontece antes ou depois dele, nunca no meio.",
      "(D) Inverte os papéis: mutex recebe o 1 que estava em %ax.",
    ],
  },
  {
    bloco: 4, dif: "média",
    enunciado: "Três threads rodam o **ticket.s**, cada uma várias vezes. O fetchadd soma à memória e devolve o valor antigo, de forma atômica. Num instante, a saída mostra **ticket = 7** e **turn = 5**.",
    codigo: [{ titulo: "ticket.s", texto: `.acquire
mov $1, %ax
fetchadd %ax, ticket  # pega um número
.tryagain
mov turn, %cx         # é a minha vez?
test %cx, %ax
jne .tryagain
# ... seção crítica ...
mov $1, %ax
fetchadd %ax, turn    # chama o próximo` }],
    comando: "Quantas threads pegaram um número e ainda não liberaram o lock, e qual número entra a seguir?",
    alt: ["7; o número 5", "2; o número 7", "1; o número 6", "2; o número 6"],
    gab: 3,
    just: [
      "ticket é o próximo número a distribuir: já saíram os números 0 a 6. turn é o número da vez, e cada liberação soma 1 a ele: os números 0 a 4 já passaram pela seção crítica. Seguram números ainda não atendidos o 5, que é a vez dele, e o 6, que espera. Quando o 5 liberar, turn vira 6. A terceira thread está fora da aquisição.",
      "(A) Confunde a quantidade de números distribuídos com a de threads; são só três threads.",
      "(B) O 7 ainda nem foi distribuído; quem entra é o próximo número já pego, o 6.",
      "(C) Esquece a thread do número 5, a dona do lock.",
    ],
  },
  {
    bloco: 4, dif: "média",
    enunciado: "Duas threads, **interrupção a cada 6 instruções**. A thread 0 pega o lock e é interrompida dentro da seção crítica. Compare o primeiro turno da thread 1 no **test-and-set.s** (questão 7) e no **yield.s**, cuja aquisição está ao lado.",
    codigo: [{ titulo: "yield.s", texto: `.acquire
mov  $1, %ax
xchg %ax, mutex
test $0, %ax
je   .acquire_done
yield             # cede a CPU
j    .acquire
.acquire_done` }],
    comando: "Quantas instruções a thread 1 executa nesse turno, e quantos xchg, em cada programa?",
    alt: [
      "test-and-set: 6 e 2; yield: 6 e 2",
      "test-and-set: 6 e 2; yield: 5 e 1",
      "test-and-set: 4 e 1; yield: 5 e 1",
      "test-and-set: 6 e 2; yield: nenhuma",
    ],
    gab: 1,
    just: [
      "No test-and-set.s, a thread 1 gira até a interrupção: mov, xchg, test, jne, mov, xchg, ou seja, 6 instruções e 2 xchg, todas inúteis. No yield.s, ela tenta uma vez (mov, xchg, test, je) e executa o yield: 5 instruções e 1 xchg, e a CPU volta para a thread 0, que pode liberar o lock. Com turnos maiores, a diferença cresce: o spin gasta o turno inteiro, o yield continua gastando 5 instruções.",
      "(A) Supõe que o yield não muda nada.",
      "(C) Supõe que o test-and-set.s também para depois de uma tentativa; ele só para na interrupção.",
      "(D) Supõe que a thread 1 nem roda enquanto o lock está ocupado; ela precisa tentar uma vez para descobrir isso.",
    ],
  },
  {
    bloco: 4, dif: "difícil",
    enunciado: "Duas threads rodam o **test-and-set.s**, uma passada cada (bx = 1), com **interrupção a cada 5 instruções**. A thread 0 começa, e o x86.py também troca de thread quando uma delas chega ao halt.",
    codigo: [{ titulo: "test-and-set.s", texto: `1000 mov  $1, %ax
1001 xchg %ax, mutex
1002 test $0, %ax
1003 jne  .acquire   # → 1000
1004 mov  count, %ax
1005 add  $1, %ax
1006 mov  %ax, count
1007 mov  $0, mutex  # libera
1008 sub  $1, %bx
1009 test $0, %bx
1010 jgt  .top
1011 halt` }],
    comando: "Quantas vezes o xchg é executado ao todo, e em quantas ele devolve 1?",
    alt: ["3; em 1", "2; em nenhuma", "4; em 2", "3; em 2"],
    gab: 0,
    just: [
      "Thread 0, turno 1: 1000 a 1004; o xchg devolve 0, ela pega o lock e lê count. Thread 1, turno 1: 1000 a 1003 e 1000; o xchg devolve 1. Thread 0, turno 2: 1005 a 1009; soma, escreve count = 1 e libera o lock em 1007. Thread 1, turno 2: 1001 em diante; o xchg devolve 0, e ela entra. São 3 xchg, e só 1 falhou. Para conferir: python3 x86.py -p test-and-set.s -t 2 -a bx=1,bx=1 -i 5 -M mutex,count -R ax -c.",
      "(B) Esquece que a thread 1 tenta enquanto a thread 0 está na seção crítica.",
      "(C) É o que acontece com -i 6: a thread 1 gira uma volta a mais antes de a thread 0 liberar.",
      "(D) Conta como falha o xchg bem-sucedido da thread 1, que acontece depois da liberação.",
    ],
  }
];
