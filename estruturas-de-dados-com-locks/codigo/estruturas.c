// Lista, fila e tabela hash concorrentes (OSTEP, cap. 29, seções 29.2 a 29.4).
//
// Cada versão é medida com T threads; o programa imprime o tempo total em segundos.
//   lista-1lock  buscas numa lista de 1.000 nós, com um lock para a lista (fig. 29.8)
//   lista-hoh    as mesmas buscas, com um lock por nó (hand-over-hand)
//   fila-1lock   metade das threads só faz enqueue, a outra metade só dequeue, com um lock para a fila
//   fila-2locks  o mesmo, com um lock na cabeça e outro na cauda (fig. 29.9)
//                (com 1 thread, ela faz os dois, alternando)
//   hash-1lock   inserções numa tabela hash de 101 buckets, com um lock para a tabela
//   hash-buckets as mesmas inserções, com um lock por bucket (fig. 29.11)
//
// Compilar: gcc -O2 -Wall -pthread -o estruturas estruturas.c
// Usar:     ./estruturas <versão> <threads> [operações por thread]

#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

static long OPS;

static double agora(void) {
    struct timespec t;
    clock_gettime(CLOCK_MONOTONIC, &t);
    return t.tv_sec + t.tv_nsec * 1e-9;
}

// ---------- Lista ligada (29.2) ----------
#define TAM_LISTA 1000

typedef struct no {
    int key;
    struct no *next;
    pthread_mutex_t lock;          // usado só no hand-over-hand
} no_t;

typedef struct {
    no_t *head;
    pthread_mutex_t lock;
} lista_t;

static lista_t L;

static void lista_insere(lista_t *l, int key) {
    no_t *novo = malloc(sizeof(no_t));
    novo->key = key;
    pthread_mutex_init(&novo->lock, NULL);
    pthread_mutex_lock(&l->lock);
    novo->next = l->head;
    l->head = novo;
    pthread_mutex_unlock(&l->lock);
}

static int lista_busca(lista_t *l, int key) {       // um lock para a lista
    int rv = -1;
    pthread_mutex_lock(&l->lock);
    for (no_t *c = l->head; c; c = c->next)
        if (c->key == key) { rv = 0; break; }
    pthread_mutex_unlock(&l->lock);
    return rv;
}

static int lista_busca_hoh(lista_t *l, int key) {   // um lock por nó
    pthread_mutex_lock(&l->lock);
    no_t *c = l->head;
    if (c) pthread_mutex_lock(&c->lock);
    pthread_mutex_unlock(&l->lock);
    while (c) {
        if (c->key == key) { pthread_mutex_unlock(&c->lock); return 0; }
        no_t *prox = c->next;
        if (prox) pthread_mutex_lock(&prox->lock);  // pega o próximo...
        pthread_mutex_unlock(&c->lock);             // ...antes de soltar o atual
        c = prox;
    }
    return -1;
}

// ---------- Fila de Michael e Scott (29.3) ----------
typedef struct noq {
    int valor;
    struct noq *next;
} noq_t;

typedef struct {
    noq_t *head, *tail;
    pthread_mutex_t head_lock, tail_lock;
    int um_lock;                   // 1: os dois lados usam head_lock
} fila_t;

static fila_t F;

static void fila_init(fila_t *q, int um_lock) {
    noq_t *ficticio = malloc(sizeof(noq_t));
    ficticio->next = NULL;
    q->head = q->tail = ficticio;
    pthread_mutex_init(&q->head_lock, NULL);
    pthread_mutex_init(&q->tail_lock, NULL);
    q->um_lock = um_lock;
}

static void fila_enqueue(fila_t *q, int valor) {
    noq_t *novo = malloc(sizeof(noq_t));
    novo->valor = valor;
    novo->next = NULL;
    pthread_mutex_t *m = q->um_lock ? &q->head_lock : &q->tail_lock;
    pthread_mutex_lock(m);
    q->tail->next = novo;
    q->tail = novo;
    pthread_mutex_unlock(m);
}

static int fila_dequeue(fila_t *q, int *valor) {
    pthread_mutex_lock(&q->head_lock);
    noq_t *velho = q->head;
    noq_t *novo_head = velho->next;
    if (novo_head == NULL) { pthread_mutex_unlock(&q->head_lock); return -1; }
    *valor = novo_head->valor;
    q->head = novo_head;
    pthread_mutex_unlock(&q->head_lock);
    free(velho);
    return 0;
}

// ---------- Tabela hash (29.4) ----------
#define BUCKETS 101

typedef struct noh {
    int key;
    struct noh *next;
} noh_t;

typedef struct {
    noh_t *head;
    pthread_mutex_t lock;
} __attribute__((aligned(64))) bucket_t;

static bucket_t H[BUCKETS];
static pthread_mutex_t lock_tabela = PTHREAD_MUTEX_INITIALIZER;
static int por_bucket;

static void hash_insere(int key) {
    noh_t *novo = malloc(sizeof(noh_t));
    novo->key = key;
    bucket_t *b = &H[key % BUCKETS];
    pthread_mutex_t *m = por_bucket ? &b->lock : &lock_tabela;
    pthread_mutex_lock(m);
    novo->next = b->head;
    b->head = novo;
    pthread_mutex_unlock(m);
}

// ---------- Trabalho de cada thread ----------
static char versao[32];
static int T;

static void *trabalho(void *arg) {
    long id = (long) arg;
    unsigned semente = (unsigned) id * 7919 + 1;
    int v;
    if (!strncmp(versao, "fila", 4)) {
        for (long i = 0; i < OPS; i++) {
            if (T == 1) { fila_enqueue(&F, (int) i); fila_dequeue(&F, &v); }
            else if (id % 2 == 0) fila_enqueue(&F, (int) i);         // produtora
            else while (fila_dequeue(&F, &v) != 0) ;                  // consumidora: tenta até conseguir
        }
        return NULL;
    }
    for (long i = 0; i < OPS; i++) {
        if (!strcmp(versao, "lista-1lock")) lista_busca(&L, rand_r(&semente) % TAM_LISTA);
        else if (!strcmp(versao, "lista-hoh")) lista_busca_hoh(&L, rand_r(&semente) % TAM_LISTA);
        else hash_insere(rand_r(&semente) & 0x7fffffff);
    }
    return NULL;
}

int main(int argc, char *argv[]) {
    if (argc < 3) {
        fprintf(stderr, "uso: %s <versão> <threads> [operações por thread]\n", argv[0]);
        return 1;
    }
    strncpy(versao, argv[1], sizeof(versao) - 1);
    T = atoi(argv[2]);
    int lista = !strncmp(versao, "lista", 5);
    OPS = argc > 3 ? atol(argv[3]) : (lista ? 2000 : 1000000);

    pthread_mutex_init(&L.lock, NULL);
    if (lista) for (int k = 0; k < TAM_LISTA; k++) lista_insere(&L, k);
    fila_init(&F, !strcmp(versao, "fila-1lock"));
    for (int b = 0; b < BUCKETS; b++) pthread_mutex_init(&H[b].lock, NULL);
    por_bucket = !strcmp(versao, "hash-buckets");

    pthread_t th[T];
    double t0 = agora();
    for (long i = 0; i < T; i++) pthread_create(&th[i], NULL, trabalho, (void *) i);
    for (int i = 0; i < T; i++) pthread_join(th[i], NULL);
    printf("%.3f\n", agora() - t0);
    return 0;
}
