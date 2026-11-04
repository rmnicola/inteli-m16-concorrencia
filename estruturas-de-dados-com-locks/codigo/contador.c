// Contador exato e contador aproximado (OSTEP, cap. 29, figs. 29.2 e 29.4).
//
// Cada thread incrementa o contador N vezes; o programa mede o tempo total.
//   S = 0: contador exato, um lock só para todas as threads (fig. 29.2).
//   S > 0: contador aproximado, um contador local por thread e um global;
//          o local passa para o global a cada S incrementos (fig. 29.4).
//
// Compilar: gcc -O2 -Wall -pthread -o contador contador.c
// Usar:     ./contador <threads> <S> [incrementos por thread, padrão 1000000]

#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define MAX_THREADS 64

// Cada contador local ocupa uma linha de cache inteira (64 bytes), para
// que duas threads nunca disputem a mesma linha sem querer.
typedef struct {
    pthread_mutex_t lock;
    int valor;
} __attribute__((aligned(64))) local_t;

typedef struct {
    pthread_mutex_t glock;     // lock do contador global
    int global;                // contador global
    local_t local[MAX_THREADS];
    int limiar;                // S
} contador_t;

static contador_t c;
static int incrementos;

static void init(int threads, int limiar) {
    pthread_mutex_init(&c.glock, NULL);
    c.global = 0;
    c.limiar = limiar;
    for (int i = 0; i < threads; i++) {
        pthread_mutex_init(&c.local[i].lock, NULL);
        c.local[i].valor = 0;
    }
}

// Contador exato: toda thread passa pelo mesmo lock a cada incremento.
static void incrementa_exato(void) {
    pthread_mutex_lock(&c.glock);
    c.global++;
    pthread_mutex_unlock(&c.glock);
}

// Contador aproximado: incrementa o local; ao chegar em S, passa para o global.
static void incrementa_aproximado(int id) {
    local_t *l = &c.local[id];
    pthread_mutex_lock(&l->lock);
    l->valor++;
    if (l->valor >= c.limiar) {
        pthread_mutex_lock(&c.glock);
        c.global += l->valor;
        pthread_mutex_unlock(&c.glock);
        l->valor = 0;
    }
    pthread_mutex_unlock(&l->lock);
}

static void *trabalho(void *arg) {
    int id = (int) (long) arg;
    for (int i = 0; i < incrementos; i++) {
        if (c.limiar == 0)
            incrementa_exato();
        else
            incrementa_aproximado(id);
    }
    return NULL;
}

int main(int argc, char *argv[]) {
    if (argc < 3) {
        fprintf(stderr, "uso: %s <threads> <S> [incrementos por thread]\n", argv[0]);
        return 1;
    }
    int threads = atoi(argv[1]);
    int limiar = atoi(argv[2]);
    incrementos = argc > 3 ? atoi(argv[3]) : 1000000;
    if (threads < 1 || threads > MAX_THREADS || limiar < 0 || incrementos < 1) {
        fprintf(stderr, "threads entre 1 e %d, S >= 0, incrementos >= 1\n", MAX_THREADS);
        return 1;
    }

    init(threads, limiar);
    pthread_t t[MAX_THREADS];
    struct timespec ini, fim;
    clock_gettime(CLOCK_MONOTONIC, &ini);
    for (long i = 0; i < threads; i++)
        pthread_create(&t[i], NULL, trabalho, (void *) i);
    for (int i = 0; i < threads; i++)
        pthread_join(t[i], NULL);
    clock_gettime(CLOCK_MONOTONIC, &fim);

    double s = (fim.tv_sec - ini.tv_sec) + (fim.tv_nsec - ini.tv_nsec) / 1e9;
    long real = (long) threads * incrementos;
    printf("%d thread(s), S = %d: %.3f s | global = %d, real = %ld, atraso = %ld\n",
           threads, limiar, s, c.global, real, real - c.global);
    return 0;
}
