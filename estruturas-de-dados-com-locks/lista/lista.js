/* Lista de exercícios 1: threads, API de threads, locks e estruturas com locks (OSTEP, caps. 26 a 29).
   Fonte única da página da lista (skill lista-exercicios). Múltipla escolha direta, quatro alternativas, uma correta;
   cada distrator representa um erro comum do assunto. Marcação: **negrito** e `código`.
   fb: um feedback por alternativa (na certa, por que está certa; nas erradas, o erro comum que ela representa).
   revisar: onde reler no OSTEP. codigo: blocos com titulo, texto e, se preciso, fonte (px); linhas quebradas à mão.
   As dissertativas ficam no fim, sem resposta. */
window.LISTA = {
  titulo: "M16 - Lista de exercícios 1",
  subtitulo: "Threads, locks e estruturas de dados com locks",
  questoes: [
    // ---------------------------------------------------------------- fáceis
    {
      dif: "fácil", cap: 26,
      enunciado: "Um programa de indexação lê arquivos do disco e, para cada arquivo lido, calcula estatísticas sobre o texto. Hoje ele faz tudo numa única thread: enquanto espera o disco, não calcula nada.",
      comando: "**Qual é o ganho** de dividir esse trabalho em várias threads?",
      alt: [
        "O tempo cai **pela metade** a cada thread nova, porque o trabalho é dividido entre elas.",
        "Enquanto uma thread **espera o disco**, outra calcula, sobrepondo E/S e computação.",
        "As threads **dispensam sincronização**, porque cada uma recebe uma cópia própria dos dados.",
        "**Nenhum**, se a máquina tiver uma só CPU, porque as threads não rodam em paralelo.",
      ],
      gab: 1,
      fb: [
        "Essa alternativa representa um erro comum: esperar aceleração linear. Dividir o trabalho entre mais threads não reduz o tempo na mesma proporção; depende de quanto dele pode de fato acontecer ao mesmo tempo e de quantas CPUs há.",
        "Isso mesmo. Threads servem para duas coisas: aproveitar várias CPUs em paralelo e evitar que o programa inteiro pare esperando E/S. Aqui, enquanto uma thread está bloqueada no disco, outra continua calculando.",
        "Essa alternativa representa um erro comum: achar que cada thread tem uma cópia dos dados. As threads de um processo compartilham o mesmo espaço de endereçamento, e é justamente por isso que precisam de sincronização.",
        "Essa alternativa representa um erro comum: achar que threads só servem com várias CPUs. Mesmo com uma CPU, enquanto uma thread espera o disco, outra usa o processador; evitar o bloqueio na E/S é um motivo independente do paralelismo.",
      ],
      revisar: "OSTEP, cap. 26, seção 26.1 (Why Use Threads?)",
    },
    {
      dif: "fácil", cap: 26,
      enunciado: "Um editor salva um documento em duas ações: grava o conteúdo novo e, depois, atualiza o ponteiro que indica qual é a versão atual. A equipe quer que essa sequência seja **atômica**.",
      comando: "**O que** isso significa?",
      alt: [
        "Que a sequência inteira execute numa **única instrução** de máquina.",
        "Que ela execute com as **interrupções desligadas** do começo ao fim.",
        "Que ocorram **todas as ações** ou nenhuma, sem estado intermediário visível.",
        "Que ela execute **mais rápido** do que uma troca de contexto do sistema.",
      ],
      gab: 2,
      fb: [
        "Essa alternativa representa um erro comum: achar que atômico significa uma instrução só. Uma operação atômica pode ser longa, como a gravação de vários blocos; o que importa é que ninguém veja o meio do caminho.",
        "Essa alternativa representa um erro comum: confundir um mecanismo com a propriedade. Desligar as interrupções é uma forma de conseguir atomicidade numa CPU só, mas não é o que a palavra significa, e não serve com várias CPUs.",
        "Isso mesmo. Atômico quer dizer \"tudo ou nada\": ou todas as ações aconteceram, ou nenhuma, e nenhum estado intermediário fica visível. É a mesma ideia das transações em bancos de dados e em sistemas de arquivos.",
        "Essa alternativa representa um erro comum: achar que atômico significa curto. Por menor que seja a sequência, uma interrupção pode cair no meio dela.",
      ],
      revisar: "OSTEP, cap. 26, seção 26.5 (The Wish For Atomicity) e o quadro Use Atomic Operations",
    },
    {
      dif: "fácil", cap: 26,
      enunciado: "A thread principal cria T1, que imprime `A`, e depois cria T2, que imprime `B`. Em seguida, espera as duas com `pthread_join`, primeiro T1 e depois T2.",
      comando: "**Quais saídas** o programa pode produzir?",
      alt: [
        "Só `AB`, porque T1 foi **criada primeiro** e, por isso, executa primeiro.",
        "Sempre `AB`, porque o `pthread_create` só **retorna** depois que T1 termina.",
        "`AB`, porque a **ordem dos `pthread_join`** define a ordem de execução.",
        "`AB` ou `BA`: só o **escalonador** decide quem executa primeiro.",
      ],
      gab: 3,
      fb: [
        "Essa alternativa representa um erro comum: achar que a ordem de criação é a ordem de execução. Depois de criada, a thread pode rodar a qualquer momento, antes ou depois das outras.",
        "Essa alternativa representa um erro comum: tratar a criação de uma thread como uma chamada de função. O `pthread_create` volta logo, e a thread nova pode rodar antes ou bem depois de quem a criou.",
        "Essa alternativa representa um erro comum: achar que o join escolhe quem roda. O `pthread_join` só faz a thread principal esperar; T1 e T2 podem ter terminado em qualquer ordem.",
        "Isso mesmo. A ordem em que T1 e T2 executam depende do escalonador, e o programa pode imprimir `AB` numa execução e `BA` na seguinte.",
      ],
      revisar: "OSTEP, cap. 26, seção 26.2 (An Example: Thread Creation)",
    },
    {
      dif: "fácil", cap: 26,
      enunciado: "Várias threads executam a função `depositar`, que tem três passos: validar o valor recebido (usando só variáveis locais), somar o valor à variável global `saldo` e gravar a operação num arquivo de log próprio de cada thread.",
      comando: "**Qual trecho é a seção crítica** dessa função?",
      alt: [
        "A **função inteira**, porque ela é executada por várias threads.",
        "A **validação do valor**, porque é ela que decide o resto da função.",
        "O **registro no log**, porque é o trecho mais demorado da função.",
        "A **soma ao saldo**, porque acessa um dado compartilhado.",
      ],
      gab: 3,
      fb: [
        "Essa alternativa representa um erro comum: achar que todo código executado por várias threads é seção crítica. Só é crítico o trecho que acessa dado compartilhado; proteger a função inteira funciona, mas serializa trabalho que poderia ser paralelo.",
        "Essa alternativa representa um erro comum: confundir \"crítico\" com \"importante\". A validação usa só variáveis locais, que são de cada thread.",
        "Essa alternativa representa um erro comum: confundir \"crítico\" com \"lento\". O log é próprio de cada thread, então não há disputa por ele.",
        "Isso mesmo. Seção crítica é o trecho que acessa um recurso compartilhado e não pode ser executado por mais de uma thread ao mesmo tempo: aqui, a leitura e a escrita de `saldo`.",
      ],
      revisar: "OSTEP, cap. 26, seções 26.3 e 26.4 e o quadro de termos-chave (critical section, race condition)",
    },
    {
      dif: "fácil", cap: 27,
      enunciado: "Uma estrutura `conta_t` é alocada com `malloc` e tem um campo `pthread_mutex_t lock`. Logo depois da alocação, várias threads começam a chamar `pthread_mutex_lock(&c->lock)`.",
      comando: "**O que falta** antes de as threads usarem o lock?",
      alt: [
        "**Inicializar** o mutex com `pthread_mutex_init` antes do primeiro uso.",
        "Chamar **`pthread_mutex_unlock`** uma vez, para que o lock comece livre.",
        "Declarar o campo como **`volatile`**, para as threads verem o mesmo lock.",
        "Nada: a **alocação com malloc** já deixa o mutex pronto para o uso.",
      ],
      gab: 0,
      fb: [
        "Isso mesmo. Todo lock precisa ser inicializado antes do uso: com `pthread_mutex_init` (em tempo de execução, como aqui) ou com `PTHREAD_MUTEX_INITIALIZER` (na declaração).",
        "Essa alternativa representa um erro comum: tentar \"liberar\" um lock que nunca foi inicializado. Destravar um mutex que não foi inicializado é um erro, não uma inicialização.",
        "Essa alternativa representa um erro comum: achar que `volatile` resolve problemas de sincronização. Ele não inicializa nada nem torna operação alguma atômica.",
        "Essa alternativa representa um erro comum: supor que a memória do malloc vem pronta. O malloc devolve memória sem valor definido, e o mutex precisa ser inicializado.",
      ],
      revisar: "OSTEP, cap. 27, seção 27.3 (Locks)",
    },
    {
      dif: "fácil", cap: 27,
      enunciado: "Um programa cria quatro threads que imprimem resultados parciais. Logo depois de criá-las, a `main` imprime \"fim\" e retorna. Às vezes, algumas threads não imprimem nada.",
      comando: "**Qual é a correção adequada**?",
      alt: [
        "Chamar **`sleep(1)`** antes do `return`, para dar tempo às threads.",
        "Chamar **`pthread_join`** para cada thread antes de a `main` retornar.",
        "Proteger cada `printf` com um **lock**, para nenhuma saída se perder.",
        "Fazer a `main` girar até a **variável global** `prontas`, que cada thread incrementa, chegar a 4.",
      ],
      gab: 1,
      fb: [
        "Essa alternativa representa um erro comum: usar tempo como sincronização. Um segundo costuma bastar, mas nada garante: com a máquina carregada, as threads podem não terminar a tempo.",
        "Isso mesmo. Quando a `main` retorna, o processo termina com todas as suas threads. O `pthread_join` faz a `main` esperar cada thread terminar.",
        "Essa alternativa representa um erro comum: achar que todo problema com threads se resolve com um lock. O problema aqui é o processo terminar antes das threads, e o lock não muda isso.",
        "Essa alternativa representa um erro comum: esperar com um laço sobre uma variável comum. A `main` gasta CPU girando e, sem lock, incrementos de `prontas` podem se perder, deixando a `main` presa no laço. Para esperar uma thread terminar, use `pthread_join`.",
      ],
      revisar: "OSTEP, cap. 27, seção 27.2 (Thread Completion)",
    },
    {
      dif: "fácil", cap: 28,
      enunciado: "Num teste de um lock novo, nenhuma execução mostra duas threads na seção crítica ao mesmo tempo, e o custo de adquirir o lock é baixo. Mas, com muitas threads, uma delas às vezes fica sem entrar por muito tempo, enquanto as outras entram várias vezes.",
      comando: "**Em qual critério** de avaliação de locks esse lock falha?",
      alt: [
        "**Exclusão mútua**, porque uma das threads fica impedida de entrar.",
        "**Desempenho**, porque a thread que espera gasta CPU girando.",
        "**Justiça**, porque uma thread que espera fica muito tempo sem o lock.",
        "**Nenhum**: com muitas threads, é normal que alguma espere mais que as outras.",
      ],
      gab: 2,
      fb: [
        "Essa alternativa representa um erro comum: confundir exclusão mútua com justiça. Exclusão mútua é não deixar duas threads entrarem juntas, e o teste mostra que isso nunca acontece.",
        "Essa alternativa representa um erro comum: confundir o desperdício do giro com uma thread que fica para trás. Gastar CPU girando é custo de desempenho; uma thread que não entra enquanto as outras entram várias vezes é falta de justiça.",
        "Isso mesmo. Os três critérios de um lock são exclusão mútua, justiça e desempenho. Uma thread que pode esperar indefinidamente (inanição) indica um lock injusto.",
        "Essa alternativa representa um erro comum: aceitar a inanição como normal. Um lock justo dá a cada thread a sua vez; esperar um pouco mais é normal, ficar para trás indefinidamente não.",
      ],
      revisar: "OSTEP, cap. 28, seção 28.4 (Evaluating Locks)",
    },
    {
      dif: "fácil", cap: 28,
      enunciado: "Um lock com espera ativa usa a instrução **test-and-set** (também chamada de troca atômica) sobre a variável `flag`.",
      comando: "**O que faz** a instrução test-and-set?",
      alt: [
        "Grava o novo valor e **devolve o antigo**, numa única operação atômica.",
        "Grava o novo valor **só se** o valor atual for igual a um valor esperado.",
        "**Soma** um valor à variável e devolve o valor que ela tinha antes.",
        "Lê o valor e **bloqueia a variável** até a thread chamar o unlock.",
      ],
      gab: 0,
      fb: [
        "Isso mesmo. O test-and-set grava o novo valor e devolve o antigo, de forma indivisível. No spin lock, a thread grava 1 e olha o antigo: se era 0, o lock estava livre e agora é dela.",
        "Essa alternativa representa um erro comum: confundir as instruções atômicas. Ela descreve o compare-and-swap, que só grava quando o valor atual é o esperado.",
        "Essa alternativa representa um erro comum: confundir as instruções atômicas. Ela descreve o fetch-and-add, usado no ticket lock.",
        "Essa alternativa representa um erro comum: achar que a instrução atômica \"trava\" a variável até o unlock. A atomicidade vale só durante a instrução; quem garante a exclusão mútua é o laço do lock em torno dela.",
      ],
      revisar: "OSTEP, cap. 28, seção 28.7 (Building Working Spin Locks with Test-And-Set)",
    },
    {
      dif: "fácil", cap: 29,
      enunciado: "Uma tabela hash com **um lock por bucket** e 1.024 buckets escala bem com 8 threads. Depois de uma mudança, a função hash passou a mandar todas as chaves para o mesmo bucket, e a vazão caiu ao nível de uma lista com um único lock.",
      comando: "**O que explica** a queda?",
      alt: [
        "A queda vem do **custo da função hash** nova, mais cara de calcular que a antiga.",
        "A tabela ficou **incorreta**: com todas as chaves num bucket, inserções se perdem.",
        "O custo de **adquirir** os 1.024 locks a cada operação passou a dominar.",
        "Todas as operações disputam o **mesmo lock**, e as threads passam a esperar em fila.",
      ],
      gab: 3,
      fb: [
        "Essa alternativa representa um erro comum: culpar o custo do cálculo, e não a disputa. Uma função hash mais cara deixaria cada operação um pouco mais lenta, mas não faria a tabela inteira cair ao nível de uma lista com um lock só; o que mudou é que todas as chaves caem no mesmo bucket.",
        "Essa alternativa representa um erro comum: confundir lento com errado. O bucket continua protegido pelo seu lock; nenhuma inserção se perde, elas só passam a esperar umas pelas outras.",
        "Essa alternativa representa um erro comum: achar que cada operação pega todos os locks. Cada operação adquire só o lock do bucket da sua chave.",
        "Isso mesmo. A tabela com um lock por bucket escala porque operações em buckets diferentes não disputam o mesmo lock. Com todas as chaves num bucket, todas as threads disputam um lock só, e a tabela se comporta como a lista com um único lock.",
      ],
      revisar: "OSTEP, cap. 29, seção 29.4 (Concurrent Hash Table)",
    },
    {
      dif: "fácil", cap: 28,
      enunciado: "Numa máquina com **uma única CPU**, uma thread gira num spin lock com test-and-set enquanto a dona do lock está fora da CPU.",
      comando: "**Que condição** é necessária para que a dona do lock volte a executar e o libere?",
      alt: [
        "Que a seção crítica seja **curta**, para a dona do lock terminar logo.",
        "Que o escalonador seja **preemptivo** e tire a CPU de quem gira.",
        "Que o lock seja **justo** e atenda as threads na ordem de chegada.",
        "Que a thread que gira tenha **prioridade maior** que a dona do lock.",
      ],
      gab: 1,
      fb: [
        "Essa alternativa representa um erro comum: olhar para a seção crítica, e não para a espera. Por menor que seja a seção, a dona do lock só termina se receber a CPU de volta.",
        "Isso mesmo. Com uma CPU, a thread que gira nunca cederia o processador sozinha. O spin lock só funciona com um escalonador preemptivo, que usa a interrupção do timer para tirar a CPU de quem gira.",
        "Essa alternativa representa um erro comum: confundir justiça com progresso. Um lock justo também gira enquanto espera, e com uma CPU continuaria precisando da preempção.",
        "Essa alternativa representa um erro comum: achar que prioridade acelera a espera. Com uma CPU, uma thread de prioridade maior girando é justamente o que impede a dona do lock de voltar a rodar.",
      ],
      revisar: "OSTEP, cap. 28, seções 28.7 e 28.8 (Evaluating Spin Locks)",
    },

    // ---------------------------------------------------------------- médias
    {
      dif: "média", cap: 27,
      enunciado: "O programa abaixo cria quatro threads e passa a cada uma o seu número. Ao executar, a saída às vezes mostra números repetidos, como `thread 2` duas vezes, e às vezes uma linha `thread 4`.",
      codigo: [{ titulo: "worker.c", texto: `void *worker(void *arg) {
    int id = *(int *) arg;
    printf("thread %d\\n", id);
    return NULL;
}

// na main:
pthread_t t[4];
for (int i = 0; i < 4; i++)
    pthread_create(&t[i], NULL,
                   worker, &i);` }],
      comando: "**Qual é a causa** dessa saída?",
      alt: [
        "Todas as threads recebem o **endereço** da mesma `i`, que o laço continua alterando.",
        "O `pthread_create` **copia o valor** de `i`, mas as cópias se misturam quando duas threads começam juntas.",
        "O `printf` **não é seguro** com threads e mistura os números de saídas diferentes.",
        "As threads executam na **ordem de criação**, e a última sobrescreve o `id` das outras.",
      ],
      gab: 0,
      fb: [
        "Isso mesmo. O argumento é um ponteiro para `i`, a mesma variável para as quatro threads. Quando uma thread lê `*arg`, o laço pode já ter incrementado `i`; o `thread 4` aparece quando a leitura acontece depois do fim do laço, e aí `i` nem existe mais (comportamento indefinido). O correto é passar um valor próprio para cada thread, por exemplo um vetor com um elemento por thread.",
        "Essa alternativa representa um erro comum: achar que o `pthread_create` copia o argumento. Ele passa o ponteiro como está, e cada thread lê `i` quando começa a rodar, já com o valor que o laço deixou.",
        "Essa alternativa representa um erro comum: culpar o `printf`. Cada linha sai inteira; os números errados vêm do valor lido em `*arg`.",
        "Essa alternativa representa dois erros comuns: supor que as threads rodam na ordem de criação e que `id` é compartilhado. Cada thread tem o próprio `id`, uma variável local da sua pilha.",
      ],
      revisar: "OSTEP, cap. 27, seção 27.1 (Thread Creation)",
    },
    {
      dif: "média", cap: 27,
      enunciado: "Uma thread espera um dado ficar pronto com o trecho abaixo. Um colega sugere trocar o `if` por `while`.",
      codigo: [{ titulo: "espera pelo dado", texto: `pthread_mutex_lock(&m);
if (pronto == 0)
    pthread_cond_wait(&c, &m);
// usa o dado
pthread_mutex_unlock(&m);` }],
      comando: "**Por que** a troca é recomendada?",
      alt: [
        "Porque, com `while`, a thread **mantém o lock** enquanto espera, e ninguém altera `pronto`.",
        "Porque, com `if`, a thread **dormiria para sempre**, já que o sinal nunca a acordaria.",
        "Porque o `while` faz a thread **girar** em vez de dormir, o que responde mais rápido.",
        "Porque, ao acordar, nada garante que a **condição** valha, e ela precisa ser testada.",
      ],
      gab: 3,
      fb: [
        "Essa alternativa representa um erro comum sobre o `pthread_cond_wait`: ele libera o lock enquanto a thread dorme e o readquire antes de retornar, com `if` ou com `while`.",
        "Essa alternativa representa um erro comum: achar que o `if` impede o sinal de chegar. Com `if`, a thread acorda normalmente; o risco é seguir em frente sem a condição ser verdadeira.",
        "Essa alternativa representa um erro comum: confundir o laço com espera ativa. Dentro do `while`, a thread continua dormindo no `pthread_cond_wait`; o laço só repete o teste quando ela acorda.",
        "Isso mesmo. Algumas implementações acordam a thread sem que ninguém tenha sinalizado (despertar espúrio), e a condição pode ainda ser falsa. Com `while`, a thread testa de novo e volta a esperar se for preciso. Há outro motivo, que aparece com várias threads esperando, e ele volta no capítulo de variáveis de condição.",
      ],
      revisar: "OSTEP, cap. 27, seção 27.4 (Condition Variables)",
    },
    {
      dif: "média", cap: 26,
      enunciado: "A variável global `x` começa em 1. A thread T1 executa uma vez `x = x + 1;`, e a thread T2 executa uma vez `x = x * 2;`, sem lock. Cada comando vira três instruções: carregar, calcular e guardar.",
      comando: "**Quais valores finais** de `x` são possíveis?",
      alt: [
        "Só **4**, porque T1 aparece primeiro no código e, por isso, executa antes.",
        "**3 ou 4**, conforme a ordem em que os dois comandos executam.",
        "**2, 3 ou 4**, porque uma thread pode gravar por cima do resultado da outra.",
        "**1, 2, 3 ou 4**, porque as duas escritas podem se anular e devolver o 1.",
      ],
      gab: 2,
      fb: [
        "Essa alternativa representa um erro comum: achar que a ordem do código é a ordem de execução. As threads podem rodar em qualquer ordem, e até se intercalar.",
        "Essa alternativa representa um erro comum: tratar cada comando como indivisível. Em sequência, os resultados são 4 (T1 antes) ou 3 (T2 antes); mas, se as duas leem 1 antes de qualquer uma gravar, quem grava por último deixa 2.",
        "Isso mesmo. T1 antes de T2: (1 + 1) × 2 = 4. T2 antes de T1: 1 × 2 + 1 = 3. Se as duas leem 1 antes de qualquer escrita, cada uma calcula 2, e quem grava por último deixa 2.",
        "Essa alternativa representa um erro comum: achar que escritas simultâneas se anulam. Cada thread grava o resultado do próprio cálculo (2, 3 ou 4); nenhuma combinação devolve 1.",
      ],
      revisar: "OSTEP, cap. 26, seções 26.3 e 26.4 (Shared Data e Uncontrolled Scheduling)",
    },
    {
      dif: "média", cap: 28,
      enunciado: "Um lock usa a instrução **compare-and-swap**: `CAS(p, esperado, novo)` grava `novo` em `*p` só se `*p == esperado` e devolve o valor antigo, tudo atomicamente. Ao escrever o `lock()`, um colega trocou a comparação do laço, e o código ficou assim:",
      codigo: [{ titulo: "lock.c", texto: `void lock(lock_t *l) {
    while (CAS(&l->flag, 0, 1) == 0)
        ;
}

void unlock(lock_t *l) {
    l->flag = 0;
}` }],
      comando: "**O que acontece** com esse lock?",
      alt: [
        "Com o lock **ocupado**, o CAS devolve 1, e a thread sai do laço e entra junto com a dona.",
        "Com o lock **livre**, a thread fica presa no laço, porque o CAS devolve 0 a cada volta.",
        "Ele funciona **como o original**: o CAS grava 1 nos dois casos, e a thread entra com o lock.",
        "A thread **não sai do laço** em caso algum, porque o CAS grava 1 e devolve 0 a cada volta.",
      ],
      gab: 0,
      fb: [
        "Isso mesmo. Com o lock ocupado (1), o CAS não grava e devolve 1; a condição `== 0` é falsa, e a thread sai do laço e entra junto com a dona: não há exclusão mútua. Com o lock livre, a primeira chamada grava 1 e devolve 0 (a thread continua no laço), e a segunda devolve 1: a thread entra, agora com o lock.",
        "Essa alternativa representa um erro comum: analisar só a primeira volta do laço. A primeira chamada grava 1 e devolve 0, mas a segunda encontra 1 e devolve 1, e a thread sai do laço.",
        "Essa alternativa representa um erro comum: olhar só para a gravação e esquecer a condição do laço. Com o lock ocupado, o CAS não grava nada e devolve 1; com `== 0`, isso faz a thread sair do laço e entrar.",
        "Essa alternativa representa um erro comum: ler o CAS ao contrário. Ele só grava quando o valor atual é o esperado (0) e devolve o valor antigo; a partir da segunda volta, ou com o lock ocupado, ele devolve 1, e a thread sai do laço.",
      ],
      revisar: "OSTEP, cap. 28, seção 28.9 (Compare-And-Swap)",
    },
    {
      dif: "média", cap: 28,
      enunciado: "Num processador com **load-linked** e **store-conditional**, o lock lê `flag` com LL e, se ela vale 0, tenta gravar 1 com SC. As threads T1 e T2, em CPUs diferentes, executam o LL ao mesmo tempo e as duas leem 0.",
      comando: "**O que acontece** quando as duas tentam o SC?",
      alt: [
        "As duas **conseguem** gravar 1, e ambas entram na seção crítica.",
        "**Só uma** consegue; o SC da outra falha, e ela volta a tentar.",
        "As duas **falham** para sempre, e o lock fica travado sem dono.",
        "O SC da segunda **sobrescreve** o da primeira, que perde o lock.",
      ],
      gab: 1,
      fb: [
        "Essa alternativa representa um erro comum: tratar o SC como uma escrita comum. Ele só grava se ninguém escreveu em `flag` desde o LL daquela thread.",
        "Isso mesmo. O primeiro SC grava 1 e tem sucesso. O da outra thread falha, porque `flag` foi escrita depois do seu LL; ela repete o LL, vê 1 e continua esperando.",
        "Essa alternativa representa um erro comum: achar que a falha de um SC faz os dois falharem. Um dos SC é o primeiro e tem sucesso; só o outro falha.",
        "Essa alternativa representa um erro comum: tratar o SC como uma escrita sem condição. É justamente o caso que ele impede: depois que a primeira gravou, o SC da segunda falha.",
      ],
      revisar: "OSTEP, cap. 28, seção 28.10 (Load-Linked and Store-Conditional)",
    },
    {
      dif: "média", cap: 28,
      enunciado: "Para não gastar CPU girando, uma equipe troca a espera do spin lock por `yield()`: quem não consegue o lock cede a CPU. O sistema tem **uma CPU** e **100 threads** disputando o lock, com escalonamento round-robin.",
      comando: "**Qual problema** continua existindo?",
      alt: [
        "Duas threads podem **entrar juntas** na seção crítica, porque o `yield` a libera.",
        "**Nenhum**: com o `yield`, quem espera dorme até o lock ser liberado, como numa fila.",
        "Cada espera ainda custa **trocas de contexto**, e uma thread pode esperar sem fim.",
        "Com o `yield`, a dona do lock **perde a CPU** mais vezes e demora mais para terminar.",
      ],
      gab: 2,
      fb: [
        "Essa alternativa representa um erro comum: confundir a espera com a seção crítica. O `yield` só muda o que a thread faz enquanto espera; a exclusão mútua continua garantida pelo test-and-set.",
        "Essa alternativa representa um erro comum: confundir ceder a CPU com dormir. A thread que chama `yield` continua pronta e volta a ser escalonada só para testar o lock e ceder de novo; dormir exige uma fila e apoio do sistema (park/unpark).",
        "Isso mesmo. Com 100 threads, a dona do lock pode esperar que as outras 99 rodem, cada uma só para ceder a CPU de novo: são muitas trocas de contexto. E nada impede que uma thread perca a vez indefinidamente (inanição).",
        "Essa alternativa representa um erro comum: achar que o `yield` de quem espera atrapalha a dona do lock. Quem chama `yield` é a thread que espera; a dona só perde a CPU pelo timer, como antes, e ceder a CPU até a ajuda a voltar mais cedo.",
      ],
      revisar: "OSTEP, cap. 28, seção 28.13 (A Simple Approach: Just Yield, Baby)",
    },
    {
      dif: "média", cap: 28,
      enunciado: "Um **lock de duas fases** faz quem não consegue o lock girar por um curto período e, se ainda não conseguiu, dormir até ser acordado (o mutex do Linux, feito com futex, é uma forma dele). Ele é usado num serviço em que o lock quase sempre fica ocupado por vários milissegundos, muito mais que a fase de giro.",
      comando: "**Como** esse lock se comporta nesse serviço?",
      alt: [
        "Como um lock que **só dorme**, sem custo extra: o giro inicial não pesa nada.",
        "Melhor que um lock que só dorme, porque **girar** antes economiza a troca de contexto.",
        "Garante **justiça**, porque a fase de giro coloca as threads em ordem de chegada.",
        "Quase sempre **dorme** depois de girar à toa: paga o giro e ainda a troca de contexto.",
      ],
      gab: 3,
      fb: [
        "Essa alternativa representa um erro comum: achar que a fase de giro é de graça. A cada espera, a thread gasta CPU girando antes de dormir; aqui, com o lock ocupado por milissegundos, esse giro é desperdício puro.",
        "Essa alternativa representa um erro comum: achar que o híbrido é sempre melhor. Girar antes só economiza a troca de contexto quando o lock é liberado durante o giro; se não for, a thread gira à toa e dorme mesmo assim.",
        "Essa alternativa representa um erro comum: achar que girar ordena as threads. Na fase de giro, quem acabou de chegar pode pegar o lock na frente de quem espera há mais tempo.",
        "Isso mesmo. As duas fases ganham quando o lock é liberado logo. Com o lock ocupado por milissegundos, o giro quase nunca basta: a thread gasta o giro e depois dorme do mesmo jeito. Se a combinação compensa ou não depende da carga.",
      ],
      revisar: "OSTEP, cap. 28, seções 28.15 e 28.16 (Different OS, Different Support e Two-Phase Locks)",
    },
    {
      dif: "média", cap: 28,
      enunciado: "O lock com fila (park/unpark) foi criado para não girar enquanto o lock está ocupado. Mesmo assim, `lock()` e `unlock()` começam girando para pegar o spin lock `guard`, que protege `flag` e a fila.",
      comando: "**Por que** esse giro é aceitável?",
      alt: [
        "Porque `guard` é um **ticket lock**, e quem gira por ele é atendido em ordem.",
        "Porque `guard` protege só **poucas instruções**, e não a seção crítica do usuário.",
        "Porque, enquanto gira por `guard`, a thread fica com as **interrupções desligadas**.",
        "Porque o giro por `guard` só acontece com **várias CPUs**; com uma CPU, ninguém gira.",
      ],
      gab: 1,
      fb: [
        "Essa alternativa representa um erro comum: achar que justiça encurta a espera. No livro, `guard` é um spin lock com test-and-set, mas mesmo um lock justo giraria; o que torna o giro aceitável é ele ser curto.",
        "Isso mesmo. `guard` só é segurado durante as poucas instruções de `lock()` e `unlock()` que mexem em `flag` e na fila, e não durante a seção crítica do usuário. A espera por ele é curta; a espera longa, pelo lock de verdade, é dormindo.",
        "Essa alternativa representa um erro comum: confundir spin lock com desligar interrupções. A thread que gira por `guard` pode ser interrompida normalmente; nada desliga as interrupções.",
        "Essa alternativa representa um erro comum: achar que com uma CPU ninguém gira. A dona de `guard` pode ser interrompida no meio de `lock()` ou `unlock()`, e as outras giram enquanto ela não volta; é raro e curto, mas acontece.",
      ],
      revisar: "OSTEP, cap. 28, seção 28.14 (Using Queues: Sleeping Instead Of Spinning)",
    },
    {
      dif: "média", cap: 29,
      enunciado: "Um sistema operacional protegia o kernel inteiro com **um único lock**. Para escalar em servidores com muitos núcleos, a equipe o trocou por um lock por subsistema. Nos servidores de 64 núcleos, o kernel ficou mais rápido; nos notebooks de 2 núcleos, ficou um pouco mais lento.",
      comando: "**O que explica** a diferença?",
      alt: [
        "Locks menores **sempre** aceleram; a lentidão nos notebooks indica um erro de medição.",
        "Com mais locks, surgiram **deadlocks** que só aparecem com poucos núcleos.",
        "Com 2 núcleos, havia pouca **disputa** pelo lock único; os locks extras só somam custo.",
        "Um lock por subsistema **não garante** exclusão mútua quando há poucos núcleos.",
      ],
      gab: 2,
      fb: [
        "Essa alternativa representa um erro comum: achar que mais concorrência é sempre mais rápida. Cada lock a mais custa aquisições; o ganho só aparece quando a disputa pelo lock único era o gargalo.",
        "Essa alternativa representa um erro comum: confundir lentidão com deadlock. Um deadlock pararia o sistema, não o deixaria um pouco mais lento.",
        "Isso mesmo. Com 2 núcleos, raramente duas threads queriam o lock único ao mesmo tempo, então ele quase não atrapalhava; com vários locks, cada operação passa a adquirir e liberar mais locks, e esse custo aparece. Com 64 núcleos, a disputa pelo lock único era o gargalo, e dividi-lo compensa.",
        "Essa alternativa representa um erro comum: confundir desempenho com correção. Cada lock garante exclusão mútua na parte que protege, com qualquer número de núcleos.",
      ],
      revisar: "OSTEP, cap. 29: quadro More Concurrency Isn't Necessarily Faster (fim da 29.1), seção 29.5 e o quadro Avoid Premature Optimization (depois da 29.5)",
    },
    {
      dif: "média", cap: 29,
      enunciado: "Uma fila concorrente usa **dois locks**: um para a cabeça, usado pelo `dequeue`, e outro para a cauda, usado pelo `enqueue`. Para economizar memória, uma colega propõe tirar o nó fictício: com a fila vazia, `head` e `tail` passam a valer `NULL`.",
      comando: "**Em que situação** os dois locks deixam de proteger a fila?",
      alt: [
        "Quando dois **`enqueue`** acontecem juntos, porque o lock da cauda não basta para os dois.",
        "Quando a fila está **cheia**, porque os dois locks disputam o último espaço livre.",
        "Em **nenhuma**: o nó fictício só economiza uma comparação com `NULL`.",
        "Com a fila **vazia ou com um elemento**: `enqueue` e `dequeue` mexem nos mesmos ponteiros.",
      ],
      gab: 3,
      fb: [
        "Essa alternativa representa um erro comum: achar que dois `enqueue` escapam do lock da cauda. Os dois usam o mesmo lock e continuam um de cada vez, com ou sem o nó fictício.",
        "Essa alternativa representa um erro comum: supor um limite de tamanho. Essa fila é uma lista encadeada sem tamanho máximo; ela não fica \"cheia\".",
        "Essa alternativa representa um erro comum: achar que o nó fictício é só uma economia. Ele existe para separar as pontas da fila; sem ele, os dois locks deixam de bastar.",
        "Isso mesmo. Sem o fictício, com a fila vazia o `enqueue` precisa mudar `head`, que é do `dequeue`; com um elemento só, o `dequeue` precisa mudar `tail`, que é do `enqueue`. Cada operação passa a mexer no que o lock da outra protege.",
      ],
      revisar: "OSTEP, cap. 29, seção 29.3 (Concurrent Queues, fig. 29.9)",
    },

    // ---------------------------------------------------------------- difíceis
    {
      dif: "difícil", cap: 26,
      enunciado: "Duas threads, T1 e T2, executam cada uma **duas vezes** o incremento de `counter`, que começa em 0. Cada incremento consiste em três instruções: carregar `counter` num registrador, somar 1 ao registrador e guardar o registrador em `counter`. Cada thread tem o próprio registrador. Há **uma CPU**; o escalonador começa por T1 e troca de thread **a cada 2 instruções**, alternando T1 e T2 até as duas terminarem.",
      comando: "**Quanto vale** `counter` no fim?",
      alt: [
        "**4**: cada thread completa os seus dois incrementos, e as trocas mudam apenas a ordem.",
        "**3**: só o primeiro incremento de cada thread se sobrepõe, e um deles se perde.",
        "**2**: os incrementos se sobrepõem aos pares, e em cada par um deles se perde.",
        "**1**: cada troca no meio de um incremento descarta o trabalho de uma thread.",
      ],
      gab: 2,
      fb: [
        "Essa alternativa representa um erro comum: achar que trocar de thread só muda a ordem. Uma troca entre o carregar e o guardar faz uma thread trabalhar com um valor antigo.",
        "Essa alternativa representa um erro comum: achar que uma corrida perde no máximo um incremento. Turno a turno, o segundo par também se sobrepõe: T1 e T2 carregam 1 antes de qualquer uma guardar 2.",
        "Isso mesmo. Turno a turno: T1 carrega 0 e soma (reg 1); T2 carrega 0 e soma (reg 1); T1 guarda 1 e carrega 1; T2 guarda 1 e carrega 1; T1 soma e guarda 2; T2 soma e guarda 2. Dois incrementos se perdem.",
        "Essa alternativa representa um erro comum: achar que uma troca descarta trabalho. A thread volta exatamente de onde parou; o que se perde é uma atualização sobrescrita por outra.",
      ],
      revisar: "OSTEP, cap. 26, seção 26.4 (Uncontrolled Scheduling, fig. 26.7) e o homework com o x86.py",
    },
    {
      dif: "difícil", cap: 28,
      enunciado: "Um lock com fila funciona assim: para adquirir, a thread pega um spin lock `guard`; se o lock estiver ocupado, ela entra na fila, libera `guard` e chama `park()` para dormir. Para liberar, a dona pega `guard` e, se houver alguém na fila, passa o lock para a primeira thread e chama `unpark()` para acordá-la. Num teste de estresse, de vez em quando uma thread dorme **para sempre**, e, a partir daí, toda thread que tenta o lock também fica parada.",
      codigo: [{ titulo: "lock(), com o lock ocupado", texto: `queue_add(m->q, gettid());
m->guard = 0;
park();` }],
      comando: "T1 é a dona do lock, e T2 tenta adquiri-lo. **Qual ordem de eventos** faz T2 dormir para sempre?",
      alt: [
        "T2 entra na fila e solta `guard`; T1 pega `guard` e faz o `unpark(T2)`; **só então** T2 chama `park()`.",
        "T2 entra na fila, solta `guard` e chama `park()`; **depois**, T1 pega `guard` e faz o `unpark(T2)`.",
        "T1 faz o `unpark(T2)` **antes** de T2 entrar na fila; depois, T2 entra, solta `guard` e chama `park()`.",
        "T2 entra na fila; T1 pega `guard` **ao mesmo tempo**, vê a fila vazia e zera `flag`; T2 chama `park()`.",
      ],
      gab: 0,
      fb: [
        "Isso mesmo. Entre soltar `guard` e chamar `park()` há uma janela: se T1 faz o `unpark(T2)` nela, o aviso chega antes de T2 dormir e se perde. T2 dorme sem ninguém para acordá-la e, como o lock já foi passado a ela, ninguém mais entra. A correção é chamar `setpark()` antes de soltar `guard`: se o `unpark()` vier antes, o `park()` volta na hora.",
        "Essa alternativa representa um erro comum: achar que qualquer ordem dá problema. Nessa ordem, T2 já está dormindo quando o `unpark()` chega e acorda normalmente: é o caso que funciona.",
        "Essa alternativa representa um erro comum: esquecer que a dona só acorda quem está na fila. Se T2 ainda não entrou na fila, T1 não tem quem acordar: com a fila vazia, ela zera `flag`, e T2 pega o lock sem dormir.",
        "Essa alternativa representa um erro comum: achar que `guard` não protege a fila. Enquanto T2 está entre `queue_add()` e soltar `guard`, ela segura `guard`; T1 só consegue olhar a fila depois que T2 o solta, e aí T2 já está nela.",
      ],
      revisar: "OSTEP, cap. 28, seção 28.14 (Using Queues: Sleeping Instead Of Spinning, fig. 28.9)",
    },
    {
      dif: "difícil", cap: 29,
      enunciado: "Um serviço usa a busca abaixo numa lista compartilhada por várias threads. Nos testes, buscas por chaves que não existem funcionam sem problema. Mas, logo depois da **primeira busca que encontra a chave**, todas as threads que usam a lista param, e o serviço não se recupera.",
      codigo: [{ titulo: "list.c", fonte: 22, texto: `int List_Lookup(list_t *L, int key) {
    pthread_mutex_lock(&L->lock);
    node_t *curr = L->head;
    while (curr) {
        if (curr->key == key)
            return 0;
        curr = curr->next;
    }
    pthread_mutex_unlock(&L->lock);
    return -1;
}` }],
      comando: "**Qual é a causa**, e qual correção a evita?",
      alt: [
        "Ao achar a chave, a função **retorna com o lock adquirido**. Sair do laço e liberar o lock num único ponto de saída resolve.",
        "Ao achar a chave, a busca **não avança** `curr` e fica presa no laço. Avançar `curr` antes de comparar as chaves resolve.",
        "Buscas **dispensam lock**, e o lock da busca bloqueia as inserções. Tirar o lock da busca e deixá-lo só nas inserções resolve.",
        "A busca segura o lock **durante a travessia**, e as outras threads esperam demais. Trocar por hand-over-hand resolve.",
      ],
      gab: 0,
      fb: [
        "Isso mesmo. Quando a chave existe, o `return 0` sai da função sem o `unlock`; daí em diante, toda thread que chama a lista espera um lock que ninguém vai liberar. Buscas por chaves inexistentes passam pelo `unlock` do fim, por isso funcionam. A forma recomendada guarda o resultado numa variável, faz `break` e tem um único caminho de saída, com o `unlock` antes do `return`.",
        "Essa alternativa representa um erro comum: ler errado o fluxo do laço. Quando a chave é encontrada, a função não continua no laço: o `return 0` sai dela na hora. O problema é sair sem liberar o lock.",
        "Essa alternativa representa um erro comum: achar que leituras não precisam de lock. Sem lock, a busca pode percorrer a lista enquanto uma inserção a altera; e o sintoma aqui não é lentidão, é parada total.",
        "Essa alternativa representa um erro comum: confundir parada com lentidão. Esperar pelo lock durante a travessia só deixa as outras threads mais lentas; aqui elas param para sempre, porque o lock nunca é liberado.",
      ],
      revisar: "OSTEP, cap. 29, seção 29.2 (Concurrent Linked Lists, figs. 29.7 e 29.8, e o quadro Be Wary Of Locks And Control Flow)",
    },
    {
      dif: "difícil", cap: 29,
      enunciado: "Uma fila com um lock na cabeça e outro na cauda começa vazia, só com o nó fictício F (`head` e `tail` apontam para F). Uma thread faz `enqueue(10)` e `enqueue(20)`; depois, outra faz o `dequeue()` abaixo, que devolve 10.",
      codigo: [{ titulo: "queue.c", fonte: 20, texto: `int Queue_Dequeue(queue_t *q,
                  int *value) {
    pthread_mutex_lock(&q->head_lock);
    node_t *tmp = q->head;
    node_t *new_head = tmp->next;
    if (new_head == NULL) {
        pthread_mutex_unlock(&q->head_lock);
        return -1; // fila vazia
    }
    *value = new_head->value;
    q->head = new_head;
    pthread_mutex_unlock(&q->head_lock);
    free(tmp);
    return 0;
}` }],
      comando: "**Para qual nó** `head` aponta depois do `dequeue`, e **quantos nós** continuam alocados?",
      alt: [
        "Para **F**, que continua fictício; 2 nós: F e o de 20.",
        "Para o **nó de 20**; 1 nó, porque F e o de 10 foram liberados.",
        "Para o **nó de 10**, que vira o novo fictício; 2 nós: o de 10 e o de 20.",
        "Para **F**; 3 nós, porque o `dequeue` só copia o valor e não libera nada.",
      ],
      gab: 2,
      fb: [
        "Essa alternativa representa um erro comum: achar que o nó fictício é sempre o mesmo e que o `dequeue` libera o nó do valor retirado. O código libera `tmp`, o fictício antigo, e o nó do valor retirado vira o novo fictício.",
        "Essa alternativa representa um erro comum: confundir `head` com o próximo valor a sair. `head` aponta para o fictício; o próximo valor a sair é o do nó seguinte a ele, 20.",
        "Isso mesmo. O `dequeue` lê o valor do nó seguinte ao fictício (10), faz `head` apontar para ele e libera o fictício antigo, F. O nó de 10 passa a ser o novo fictício; continuam alocados o de 10 e o de 20.",
        "Essa alternativa representa um erro comum: achar que o `dequeue` não libera memória. Ele chama `free(tmp)` no fictício antigo; sem isso, cada `dequeue` vazaria um nó.",
      ],
      revisar: "OSTEP, cap. 29, seção 29.3 (Concurrent Queues, fig. 29.9)",
    },
    {
      dif: "difícil", cap: 28,
      enunciado: "Num sistema embarcado com **uma CPU**, o escalonador sempre executa a thread pronta de **maior prioridade**. T1, de prioridade baixa, adquire um mutex que põe para dormir quem espera; ela ainda precisa de **2 ms** de CPU para terminar a seção crítica. T3, de prioridade alta, fica pronta, toma a CPU de T1, tenta o mutex e dorme. Logo depois, T2, de prioridade média, que não usa o mutex, fica pronta e precisa de **3 s** de CPU.",
      comando: "**Quanto tempo**, aproximadamente, T3 espera pelo mutex sem herança de prioridade, e quanto com ela?",
      alt: [
        "Cerca de **2 ms** nos dois casos: T3 só espera T1 terminar a seção crítica.",
        "Cerca de **3 s** sem herança e 2 ms com ela: sem herança, T2 sempre roda antes de T1.",
        "Cerca de **3 s** nos dois casos: a herança muda a prioridade de T1, e não a da thread T2.",
        "**Para sempre** sem herança e 3 s com ela: T3 dorme até T2 terminar.",
      ],
      gab: 1,
      fb: [
        "Essa alternativa representa um erro comum: esquecer que T1 precisa da CPU para terminar. Com uma CPU e prioridades fixas, T2 (média) roda antes de T1 (baixa), e T1 só volta quando T2 termina.",
        "Isso mesmo. Sem herança, T2 tem prioridade maior que T1 e ocupa a CPU por 3 s; só depois T1 termina os 2 ms e libera o mutex. Com herança, T1 roda com a prioridade de T3 enquanto segura o mutex, passa na frente de T2, termina em 2 ms e libera T3. É a inversão de prioridade.",
        "Essa alternativa representa um erro comum: achar que a herança precisa mexer em T2. Basta T1 ter prioridade maior que a de T2 enquanto segura o mutex; aí quem espera é T2, e não T3.",
        "Essa alternativa representa um erro comum: confundir inversão de prioridade com deadlock. Sem herança, T3 espera muito, mas não para sempre: quando T2 termina, T1 roda e libera o mutex.",
      ],
      revisar: "OSTEP, cap. 28, seção 28.14 (quadro More Reason To Avoid Spinning: Priority Inversion)",
    },
  ],

  dissertativas: [
    {
      enunciado: "Uma equipe quer um lock **justo** que não desperdice a fatia de tempo girando. Ela parte do ticket lock e troca o laço vazio por `yield()`:",
      codigo: [{ titulo: "ticket lock com yield", fonte: 20, texto: `void lock(lock_t *l) {
    int eu = FetchAndAdd(&l->ticket);
    while (l->turn != eu)
        yield();
}

void unlock(lock_t *l) {
    l->turn = l->turn + 1;
}` }],
      itens: [
        "a) **Avalie** se esse lock garante exclusão mútua e justiça, com base em `ticket` e `turn`.",
        "b) Numa máquina com **uma CPU**, round-robin e N threads disputando o lock, **descreva** o que acontece quando a dona perde a CPU na seção crítica, **estime** quantas trocas de contexto podem ocorrer até a próxima da fila entrar e **compare** com o ticket lock que gira.",
        "c) **Proponha** uma versão em que a fila dorme em vez de ceder a CPU, e **explique** que corrida entre dormir e acordar ela precisa evitar, e como.",
      ],
      fechamento: "Justifique cada resposta.",
    },
    {
      enunciado: "Um servidor de jogo guarda o saldo de moedas de cada jogador numa **tabela hash com um lock por bucket**, usada por dezenas de threads. Uma operação nova, `transferir(a, b, valor)`, tira moedas do jogador `a` e põe no jogador `b`, que podem estar em buckets diferentes. Um relatório periódico soma os saldos de todos os jogadores, pegando o lock de cada bucket.",
      itens: [
        "a) **Mostre** uma intercalação em que, se `transferir` pegar só o lock de `a` para debitar e, depois, só o lock de `b` para creditar, o relatório soma um total menor que o real.",
        "b) **Proponha** como adquirir os dois locks e **explique** como evitar que uma transferência de `a` para `b` e outra de `b` para `a`, ao mesmo tempo, fiquem esperando uma pela outra para sempre.",
        "c) **Discuta** quando valeria voltar a um lock único para a tabela inteira e **descreva** o experimento que decidiria.",
      ],
      fechamento: "Justifique cada decisão com o que você sabe sobre seções críticas, granularidade de locks e desempenho.",
    },
  ],
};
