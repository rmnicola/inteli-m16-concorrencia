/* Post-mortem da P1 (11/11/2026): as questões do componente específico da prova, já aplicada, no formato da lista
   de exercícios (skill lista-exercicios). Enunciados e alternativas iguais aos da prova; o feedback de cada
   alternativa vem da justificativa do gabarito. A discursiva fica no fim, sem resposta. */
window.LISTA = {
  titulo: "M16 - Post-mortem da P1",
  subtitulo: "Threads, locks e estruturas de dados com locks",
  questoes: [
    // ---------------------------------------------------------------- Questão 05
    {
      dif: "fácil", cap: 26,
      enunciado: "Um processo cria quatro threads, que executam o mesmo código e acessam as mesmas variáveis globais.",
      comando: "**Qual destes elementos é próprio de cada thread**, sem ser compartilhado com as outras threads do processo?",
      alt: [
        "A área de **heap** de alocação dinâmica.",
        "O conjunto de **variáveis globais**.",
        "A **pilha** de chamadas de funções.",
        "O **espaço de endereçamento** virtual.",
      ],
      gab: 2,
      fb: [
        "Essa alternativa representa um erro comum: achar que cada thread tem o próprio heap. O heap faz parte do espaço de endereçamento comum, e a memória que uma thread aloca com `malloc` pode ser usada por qualquer outra.",
        "Essa alternativa representa um erro comum: achar que cada thread tem a própria cópia das variáveis globais. Elas são compartilhadas, e é justamente por isso que aparecem condições de corrida sobre elas.",
        "Isso mesmo. As threads de um processo compartilham o mesmo espaço de endereçamento, mas cada uma tem o próprio estado de execução: contador de programa, registradores e uma pilha só dela, onde ficam as variáveis locais, os parâmetros e os endereços de retorno das funções que ela chama.",
        "Essa alternativa representa um erro comum: tratar a thread como se fosse um processo. Processos têm espaços de endereçamento separados; as threads de um mesmo processo compartilham o mesmo, e é isso que as diferencia de processos.",
      ],
      revisar: "OSTEP, cap. 26, introdução do capítulo e fig. 26.1 (Single-Threaded And Multi-Threaded Address Spaces)",
    },
    // ---------------------------------------------------------------- Questão 06
    {
      dif: "fácil", cap: 26,
      enunciado: "A thread principal de um programa, compilado sem otimizações, cria duas threads e espera que as duas terminem, com `pthread_join`. Cada thread executa 1 milhão de vezes o comando `counter = counter + 1;` sobre a variável global `counter`, que começa em 0. A cada execução do programa, o valor final de `counter` **muda** e quase sempre fica **abaixo de 2 milhões**.",
      comando: "**Qual é a causa** desse comportamento?",
      alt: [
        "Cada CPU guarda `counter` na própria **cache**, e as escritas de uma thread não chegam à cache da outra.",
        "O incremento vira **três instruções**, e outra thread pode alterar `counter` entre a leitura e a escrita.",
        "Cada thread trabalha sobre uma **cópia própria** de `counter`, e prevalece a cópia da última thread que termina.",
        "O escalonador interrompe as threads **antes do fim do laço**, e às vezes parte dos incrementos não chega a executar.",
      ],
      gab: 1,
      fb: [
        "Essa alternativa representa um erro comum: atribuir a perda à cache. O hardware mantém as caches coerentes; o problema não é uma escrita deixar de ser vista, mas as duas threads lerem o mesmo valor antes de qualquer uma escrever.",
        "Isso mesmo. O comando vira três instruções de máquina: carregar `counter` num registrador, somar 1 e guardar o resultado. Se outra thread lê `counter` entre o carregamento e o armazenamento, seja por uma troca de thread, seja rodando ao mesmo tempo em outra CPU, as duas gravam o mesmo resultado e um incremento se perde. O resultado depende da intercalação: é uma condição de corrida, e o trecho que acessa `counter` é uma seção crítica.",
        "Essa alternativa representa um erro comum: achar que cada thread tem a própria cópia das globais. `counter` é compartilhada; com cópias separadas, o resultado seria sempre exatamente 1 milhão, e não um valor que varia.",
        "Essa alternativa representa um erro comum: achar que a preempção faz a thread perder trabalho. A interrupção apenas adia a execução: a thread volta de onde parou, e o `pthread_join` garante que o programa só termina depois que as duas threads concluem o laço.",
      ],
      revisar: "OSTEP, cap. 26, seção 26.3 (Why It Gets Worse: Shared Data) e seção 26.4 (The Heart Of The Problem: Uncontrolled Scheduling)",
    },
    // ---------------------------------------------------------------- Questão 07
    {
      dif: "média", cap: 27,
      enunciado: "Considere o código a seguir. A thread principal cria a thread, espera o seu término com `pthread_join` e usa o valor devolvido.",
      codigo: [{ titulo: "mythread.c", fonte: 20, texto: `typedef struct { int x; int y; } myret_t;

void *mythread(void *arg) {
    myret_t r;
    r.x = 1;
    r.y = 2;
    return (void *) &r;
}

// na thread principal:
pthread_t p;
myret_t *m;
pthread_create(&p, NULL, mythread, NULL);
pthread_join(p, (void **) &m);
printf("%d %d\\n", m->x, m->y);` }],
      comando: "**Qual é o erro** desse código, que às vezes até imprime `1 2`?",
      alt: [
        "Falta um **lock** em volta das atribuições a `r`, pois a thread principal pode ler `r` enquanto ela é escrita.",
        "A função **`pthread_join`** não devolve o retorno da thread; o resultado deveria ir para uma variável global.",
        "A thread deveria terminar com **`pthread_exit`**, porque o `return` encerra o processo inteiro.",
        "A **variável local** `r` deixa de existir quando `mythread` retorna, e o ponteiro devolvido fica inválido.",
      ],
      gab: 3,
      fb: [
        "Essa alternativa representa um erro comum: pôr um lock em todo erro de concorrência. O `pthread_join` só retorna depois que a thread terminou, então não há leitura concorrente com a escrita; um lock não resolveria o problema, que é o tempo de vida de `r`.",
        "Essa alternativa representa um erro comum: desconhecer a API. O segundo argumento de `pthread_join` serve exatamente para receber o valor de retorno da thread.",
        "Essa alternativa representa um erro comum: confundir o retorno da função da thread com o retorno de `main`. O `return` em `mythread` encerra só aquela thread, com o mesmo efeito de `pthread_exit` com o valor devolvido.",
        "Isso mesmo. Variáveis locais ficam na pilha da thread. Quando `mythread` retorna, `r` é desalocada, e o ponteiro devolvido aponta para memória que pode ser reaproveitada a qualquer momento: o comportamento é indefinido, e imprimir `1 2` é só coincidência. O correto é alocar o resultado no heap, com `malloc`, ou recebê-lo por um ponteiro passado como argumento.",
      ],
      revisar: "OSTEP, cap. 27, seção 27.2 (Thread Completion) e fig. 27.3",
    },
    // ---------------------------------------------------------------- Questão 08
    {
      dif: "média", cap: 28,
      enunciado: "Uma equipe implementou um lock usando apenas a variável `flag`, que começa em 0. Em testes com duas threads, às vezes **as duas entram na seção crítica ao mesmo tempo**.",
      codigo: [{ titulo: "lock.c", fonte: 20, texto: `void lock(lock_t *mutex) {
    // espera enquanto estiver ocupado
    while (mutex->flag == 1)
        ;
    mutex->flag = 1;   // pega o lock
}

void unlock(lock_t *mutex) {
    mutex->flag = 0;
}` }],
      comando: "**Por que** essa implementação **não garante exclusão mútua**?",
      alt: [
        "O teste de `flag` e a atribuição `flag = 1` são **passos separados**: duas threads podem ver 0 antes que uma grave 1.",
        "A thread que espera **desperdiça CPU** girando no `while`, e esse tempo perdido pode deixar outra thread passar à frente.",
        "Falta declarar `flag` como **`volatile`**, o que tornaria o teste e a atribuição uma operação atômica.",
        "A thread que espera deveria ceder a CPU com **`yield`** em vez de girar; com essa troca, o código ficaria correto.",
      ],
      gab: 0,
      fb: [
        "Isso mesmo. Entre ler `flag` (e sair do `while`) e gravar 1, uma thread pode ser interrompida. Se a outra rodar nesse intervalo, ela também lê 0, sai do laço e pega o lock; quando a primeira volta, também grava 1 e entra. Por isso o hardware oferece instruções atômicas, como test-and-set, que leem e escrevem numa só operação indivisível.",
        "Essa alternativa representa um erro comum: confundir desempenho com correção. Girar desperdiça CPU, mas não é isso que deixa duas threads entrarem.",
        "Essa alternativa representa um erro comum: confundir `volatile` com atomicidade. `volatile` só obriga o compilador a ler e gravar `flag` na memória a cada acesso; o teste e a atribuição continuam sendo duas operações separadas, e a mesma intercalação continua possível.",
        "Essa alternativa representa um erro comum: achar que ceder a CPU resolve a corrida. O `yield` muda só o que a thread faz enquanto espera; o teste e a atribuição continuam separados, e a mesma intercalação continua possível.",
      ],
      revisar: "OSTEP, cap. 28, seção 28.6 (A Failed Attempt: Just Using Loads/Stores), figs. 28.1 e 28.2",
    },
    // ---------------------------------------------------------------- Questão 09
    {
      dif: "média", cap: 28,
      enunciado: "Dois locks garantem exclusão mútua: um feito com a instrução **test-and-set** e um **ticket lock**, feito com a instrução **fetch-and-add**.",
      comando: "**O que o ticket lock garante a mais?**",
      alt: [
        "Que a thread que não consegue o lock **dorme** numa fila, sem girar, até que o lock seja liberado.",
        "Que o lock funciona **sem instrução atômica** do hardware, só com leituras e escritas comuns.",
        "Que as threads obtêm o lock na **ordem em que pediram**, e toda thread que espera acaba entrando.",
        "Que cada thread **espera menos** pelo lock, porque, com a fila em ordem, nenhuma gira à toa.",
      ],
      gab: 2,
      fb: [
        "Essa alternativa representa um erro comum: confundir o ticket lock com os locks que põem a thread para dormir. Ele também gira: quem espera fica num laço testando `turn`.",
        "Essa alternativa representa um erro comum: confundir o ticket lock com soluções só de software, como a de Peterson. Ele depende do fetch-and-add, que é uma instrução atômica do hardware.",
        "Isso mesmo. Cada thread pega um número (fetch-and-add em `ticket`) e espera até que `turn` chegue a ele; a cada unlock, `turn` avança. As threads entram na ordem de chegada e nenhuma espera para sempre: o lock é justo. No spin lock com test-and-set, quem pega o lock depende da intercalação, e uma thread pode girar indefinidamente (seção 28.8).",
        "Essa alternativa representa um erro comum: achar que um lock justo é mais rápido. A ordem de chegada não reduz a espera, e as threads do ticket lock giram tanto quanto as do test-and-set; justiça e desempenho são critérios diferentes (seção 28.4).",
      ],
      revisar: "OSTEP, cap. 28, seção 28.11 (Fetch-And-Add), seção 28.8 (Evaluating Spin Locks) e seção 28.4 (Evaluating Locks)",
    },
    // ---------------------------------------------------------------- Questão 10
    {
      dif: "média", cap: 29,
      enunciado: "No **contador aproximado**, cada CPU tem um contador local com o próprio lock, e há um contador global com outro lock. A thread incrementa o contador local da sua CPU e, quando ele atinge o **limiar S**, transfere o valor para o global e zera o local.",
      comando: "**O que acontece ao aumentar S?**",
      alt: [
        "O contador fica **mais preciso**, porque cada transferência leva ao global mais incrementos de uma só vez.",
        "O contador escala **pior**, porque cada local acumula mais incrementos e o **lock local** fica mais disputado.",
        "O contador passa a **perder incrementos**, porque o que sobra nos locais é descartado na transferência.",
        "O contador escala **melhor**, porque o lock global é usado menos vezes, mas o global fica **mais atrasado**.",
      ],
      gab: 3,
      fb: [
        "Essa alternativa representa um erro comum: inverter a relação entre escalabilidade e precisão. Transferir mais incrementos de cada vez significa transferir menos vezes, e o global fica mais atrasado.",
        "Essa alternativa representa um erro comum: pôr a disputa no lugar errado. O lock local é usado só pelas threads da mesma CPU, e o número de vezes que ele é adquirido (uma por incremento) não depende de S.",
        "Essa alternativa representa um erro comum: confundir atraso com perda. Nenhum incremento é descartado: o que está nos contadores locais ainda não chegou ao global, mas chega na próxima transferência.",
        "Isso mesmo. Com S maior, as transferências ficam mais raras, e o lock global, que é o ponto de disputa entre as CPUs, é adquirido menos vezes: o contador escala melhor. Em troca, cada local guarda mais incrementos ainda não transferidos, e o global pode ficar até N × S abaixo da contagem real, com N CPUs. Com S = 1 ele se comporta como o contador de um lock só; com S grande, o tempo quase não cresce com o número de threads (figs. 29.5 e 29.6).",
      ],
      revisar: "OSTEP, cap. 29, seção 29.1 (Concurrent Counters), figs. 29.5 e 29.6",
    },
    // ---------------------------------------------------------------- Questão 11
    {
      dif: "difícil", cap: 28,
      enunciado: "Um serviço de log em espaço de usuário roda numa **única CPU**. As threads gravam num buffer protegido por um **spin lock** com test-and-set, e a seção crítica é **longa** (formata o texto e calcula um checksum). Com 20 threads, a vazão despenca com a CPU perto de 100%, quase todo o tempo gasto no laço de espera do `lock`.",

      comando: "**Qual explicação e qual mudança** são as mais adequadas?",
      alt: [
        "O spin lock **não é justo** e deixa threads sem entrar; a mudança é um **ticket lock**, por ordem de chegada.",
        "Quem espera gira a fatia inteira enquanto a dona do lock não roda; a mudança é um lock que **põe a thread para dormir**.",
        "Com muitas threads, o test-and-set **deixa de garantir exclusão mútua**; a mudança é um ticket lock.",
        "A seção crítica é longa demais; a mudança é **desabilitar as interrupções** enquanto ela executa.",
      ],
      gab: 1,
      fb: [
        "Essa alternativa representa um erro comum: achar que um lock justo resolve o desperdício. O sintoma não é a inanição de algumas threads, e o ticket lock também gira: o desperdício continua.",
        "Isso mesmo. Numa CPU única, quando o escalonador interrompe a dona do lock no meio da seção crítica longa, nenhuma outra thread avança: cada uma gasta a fatia de tempo inteira girando, e a dona do lock pode esperar até N − 1 fatias para voltar e liberá-lo. A saída é deixar de girar: quem não consegue o lock entra numa fila e dorme (park/unpark no Solaris, futex no Linux) até ser acordado no unlock (seções 28.14 e 28.15). Ceder a CPU com `yield` ajudaria, mas ainda custaria uma troca de contexto por thread em espera a cada volta (seção 28.13).",
        "Essa alternativa representa um erro comum: confundir desempenho com correção. O test-and-set garante exclusão mútua com qualquer número de threads; o problema aqui é desempenho.",
        "Essa alternativa representa um erro comum: recorrer à primeira solução para exclusão mútua, que não vale aqui. Desabilitar interrupções é uma operação privilegiada, que um programa em espaço de usuário não pode executar; e, mesmo no kernel, mantê-las desabilitadas durante uma seção crítica longa faz o sistema perder interrupções (seção 28.5).",
      ],
      revisar: "OSTEP, cap. 28, seção 28.8 (Evaluating Spin Locks), seção 28.12 (Too Much Spinning: What Now?) e seção 28.14 (Using Queues: Sleeping Instead Of Spinning)",
    },
    // ---------------------------------------------------------------- Questão 12
    {
      dif: "difícil", cap: 29,
      enunciado: "Uma **lista encadeada** protegida por **um único lock** passa a usar **hand-over-hand locking**: cada nó tem o próprio lock, e a thread pega o lock do próximo nó antes de soltar o do atual. Com 8 threads em 8 CPUs, fazendo buscas e inserções numa lista de 10 mil nós, a nova versão fica **mais lenta**.",

      comando: "**Qual explicação e qual decisão** são as mais adequadas?",
      alt: [
        "Pegar e soltar um lock **a cada nó** custa mais do que se ganha; a decisão é voltar ao lock único ou a locks maiores.",
        "Cada thread segura **dois locks** ao mesmo tempo; a decisão é soltar o lock do nó atual antes de pegar o do próximo.",
        "As **buscas** da versão original não usavam lock; a decisão é voltar ao lock único, mas retirá-lo das buscas.",
        "O ganho só aparece em **listas maiores**; a decisão é manter a nova versão e repetir o teste com 1 milhão de nós.",
      ],
      gab: 0,
      fb: [
        "Isso mesmo. O hand-over-hand deixa várias threads percorrerem a lista ao mesmo tempo, mas cobra a aquisição e a liberação de um lock em cada nó visitado, e esse custo costuma superar o ganho. A recomendação é começar com um lock único e só refinar quando houver um problema de desempenho medido; quando refinar, fazer cada lock proteger uma parte maior, como um lock a cada tantos nós ou uma tabela hash com um lock por bucket (seção 29.4).",
        "Essa alternativa representa um erro comum: achar que segurar dois locks é o problema, quando é isso que garante a correção. Segurar o lock do próximo nó antes de soltar o atual impede que outra thread remova ou altere esse nó no meio da travessia; soltar antes abre uma condição de corrida.",
        "Essa alternativa representa um erro comum: achar que leituras não precisam de lock. Sem lock, uma busca pode ler a lista enquanto uma inserção a altera e seguir ponteiros inconsistentes; na versão original, as buscas também adquiriam o lock.",
        "Essa alternativa representa um erro comum: achar que granularidade mais fina sempre acaba escalando. O custo de um lock por nó é pago em todos os nós visitados, qualquer que seja o tamanho da lista; mesmo com listas muito grandes e muitas threads, o hand-over-hand dificilmente supera o lock único.",
      ],
      revisar: "OSTEP, cap. 29, seção 29.2 (Concurrent Linked Lists), seção 29.4 (Concurrent Hash Table) e seção 29.5 (Summary)",
    },
  ],
  dissertativas: [
    {
      enunciado: "Um painel mostra quantos pacotes um servidor já processou no dia. O servidor tem **8 CPUs** e **8 threads**, cada uma fixada numa CPU; a cada pacote, a thread executa `total = total + 1;` sobre a global `total`, **sem sincronização**. No pico (cerca de **16 milhões de pacotes por segundo**), o painel mostra **menos pacotes** que a placa de rede.",
      itens: [
        "a) **Explique** a perda e **mostre uma intercalação** de duas threads, instrução por instrução, em que uma atualização se perde.",
        "b) **Proponha** um lock, **indique** a instrução atômica em que ele se apoia e **justifique** se é melhor girar ou dormir.",
      ],
      fechamento: "Justifique cada decisão.",
    },
  ],
};
