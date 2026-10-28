/* Questões objetivas da aula de estruturas de dados com locks (OSTEP, cap. 29), no modelo do ENADE: enunciado contextualizado e quatro alternativas,
   uma só correta. Fonte única dos slides de questão (deck.html) e do gabarito comentado (guias/gabarito.json).
   Marcação: **negrito** e `código`. "codigo" é uma lista de blocos {titulo?, texto} mostrados ao lado do enunciado.
   "just": a primeira linha explica a certa; as outras, o erro por trás de cada alternativa errada. */
window.QUESTOES = [
  {
    parte: 1, dif: "fácil",
    enunciado: "Um contador de visualizações de página usa **um único lock**. Uma thread faz 1 milhão de incrementos em **0,03 s**. Com **duas threads em duas CPUs**, 1 milhão cada, o teste leva mais de **5 s**.",
    comando: "O que explica esse resultado?",
    alt: [
      "O trabalho dobrou; a diferença para 0,06 s é ruído de medição.",
      "As threads disputam o mesmo lock a cada incremento: as atualizações saem uma de cada vez, e o lock passa de CPU em CPU.",
      "As threads incrementam ao mesmo tempo, e o tempo extra corrige as atualizações perdidas.",
      "O sistema operacional põe as duas threads na mesma CPU quando elas usam o mesmo lock.",
    ],
    gab: 1,
    just: [
      "Seção 29.1 (fig. 29.5). Com um lock só, as duas CPUs não trabalham em paralelo: cada incremento espera o lock, e a variável do lock e o contador mudam de CPU a cada vez, o que custa caro (assunto da aula de multiprocessadores). Por isso o tempo não só deixa de cair: ele explode.",
      "(A) Uma diferença de quase 100 vezes não é ruído.",
      "(C) O lock garante justamente que nenhuma atualização se perca; não há correção a fazer.",
      "(D) O escalonador não junta threads por causa de um lock.",
    ],
  },
  {
    parte: 1, dif: "fácil",
    enunciado: "Um cache de sessões guarda os dados numa **tabela hash** de 1.024 buckets, cada um com uma lista. Com 8 threads, a versão com **um lock por bucket** faz muito mais operações por segundo que a versão com **um lock para a tabela inteira**.",
    comando: "Por que a versão com um lock por bucket escala melhor?",
    alt: [
      "Cada bucket passa a ter menos elementos, e as buscas ficam mais curtas.",
      "Com um lock por bucket, as leituras dispensam a exclusão mútua.",
      "Com mais locks, o sistema operacional escalona as threads em mais CPUs.",
      "Operações em buckets diferentes não disputam o mesmo lock e acontecem ao mesmo tempo.",
    ],
    gab: 3,
    just: [
      "Seção 29.4 (fig. 29.11). O número de buckets e de elementos é o mesmo nas duas versões; muda só a granularidade do lock. Com 1.024 buckets, duas threads raramente caem no mesmo, e as 8 trabalham em paralelo.",
      "(A) As listas têm o mesmo tamanho nas duas versões.",
      "(B) As leituras continuam pegando o lock do bucket.",
      "(C) O escalonamento não depende do número de locks.",
    ],
  },
  {
    parte: 1, dif: "média",
    enunciado: "Um **contador aproximado** tem os locais L1, L2 e L3 e o global G, todos em 0, com **limiar S = 4**: quando um local chega a 4, o valor dele vai para G e o local volta a 0. Os incrementos caem, em ordem, nestes locais:",
    codigo: [{ texto: `L1 L2 L1 L3 L1 L1
L2 L3 L2 L2 L3` }],
    comando: "Depois do 11º incremento, quanto vale G, e qual é a contagem real?",
    alt: ["G = 8; real 11", "G = 11; real 11", "G = 4; real 11", "G = 8; real 8"],
    gab: 0,
    just: [
      "L1 chega a 4 no 6º incremento (G = 4) e L2 no 10º (G = 8). L3 termina em 3, ainda não transferido. A contagem real é o total de incrementos, 11 = 8 + 3: G fica 3 abaixo.",
      "(B) Supõe que G acompanha cada incremento; é o contador exato.",
      "(C) Esquece a transferência de L2 no 10º incremento.",
      "(D) Confunde a contagem real com G; os 3 incrementos de L3 aconteceram, só não chegaram ao global.",
    ],
  },
  {
    parte: 1, dif: "média",
    enunciado: "A fila concorrente de Michael e Scott tem **um lock para a cabeça** (usado por dequeue) e **outro para a cauda** (usado por enqueue), e começa com um **nó fictício**, que não guarda valor.",
    codigo: [{ texto: `void Queue_Init(queue_t *q) {
    node_t *tmp = malloc(sizeof(node_t));
    tmp->next = NULL;     // nó fictício
    q->head = q->tail = tmp;
    pthread_mutex_init(&q->head_lock, NULL);
    pthread_mutex_init(&q->tail_lock, NULL);
}` }],
    comando: "Qual é o papel do nó fictício?",
    alt: [
      "Guardar o tamanho da fila, para dequeue saber se ela está vazia sem pegar lock.",
      "Garantir que os dois locks sejam sempre adquiridos na mesma ordem.",
      "Manter cabeça e cauda separadas mesmo com a fila vazia, para cada operação usar um lock só.",
      "Tornar a fila livre de locks.",
    ],
    gab: 2,
    just: [
      "Seção 29.3 (fig. 29.9). Sem o nó fictício, numa fila vazia ou com um elemento, head e tail apontariam para o mesmo nó, e enqueue e dequeue mexeriam nele ao mesmo tempo, cada uma com um lock diferente. Com ele, enqueue só altera o último nó e tail, e dequeue só head.",
      "(A) O nó fictício não guarda contagem; dequeue descobre a fila vazia por head->next == NULL, com o lock da cabeça.",
      "(B) Cada operação pega um lock só; não há ordem de aquisição a respeitar.",
      "(D) Os dois locks continuam lá; o nó fictício só permite que eles sejam independentes.",
    ],
  },
  {
    parte: 1, dif: "difícil",
    enunciado: "**4 threads** incrementam um contador aproximado **1.000.000** de vezes cada, com **S = 1.024**. Cada thread tem o próprio contador local, que vai para o global sempre que chega a S.",
    codigo: [{ titulo: "contador.c", texto: `l->valor++;
if (l->valor >= c.limiar) {
    pthread_mutex_lock(&c.glock);
    c.global += l->valor;
    pthread_mutex_unlock(&c.glock);
    l->valor = 0;
}` }],
    comando: "Quantas vezes o lock global é adquirido ao todo, e quanto o global fica abaixo da contagem real?",
    alt: ["976; 576", "4.000.000; 0", "3.904; 4.096", "3.904; 2.304"],
    gab: 3,
    just: [
      "1.000.000 = 976 × 1.024 + 576. Cada thread transfere 976 vezes, e as quatro somam 4 × 976 = 3.904 aquisições do lock global, contra 4.000.000 no contador exato: cerca de mil vezes menos disputa. Em cada local sobram 576 incrementos que não chegaram ao global: 4 × 576 = 2.304. O contador.c mostra esse atraso no fim (./contador 4 1024).",
      "(A) Faz a conta de uma thread só.",
      "(B) É o comportamento do contador exato.",
      "(C) Usa N × S, que é o limite do atraso (cada local guarda no máximo S − 1), não o atraso desta execução.",
    ],
  },
];
