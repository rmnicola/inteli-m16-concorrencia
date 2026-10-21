#!/usr/bin/env python3
"""Verifica o contraste das cores do site (site/estilo.css), nos temas claro e escuro.

Regras (ver site/DESIGN.md, seção Contraste), baseadas no WCAG 2.2:
  C1  texto principal (corpo, títulos, links)        >= 7:1   (AAA, 1.4.6)
  C2  texto secundário (rótulos, datas, legendas)    >= 4.5:1 (AA, 1.4.3)
  C3  realce de sintaxe e texto dentro de código     >= 4.5:1 (AA, 1.4.3)
  C4  componentes e ícones interativos (bordas de    >= 3:1   (AA, 1.4.11)
      campos e botões, ícone de copiar, foco)
  T1  nenhum texto abaixo de 13px (0.8125rem); tamanhos relativos (em) só dentro de max(..., 13px)
Divisórias puramente decorativas (--borda-fraca) não entram: não carregam
informação. Cores com transparência são compostas sobre o fundo em que aparecem.

    python tools/verificar_contraste.py      # sai com código 1 se alguma regra falhar
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

CSS = Path(__file__).resolve().parents[1] / "site" / "estilo.css"

# (frente, fundo, regra, descrição)
PARES = [
    ("--texto", "--fundo", "C1", "corpo do texto"),
    ("--texto", "--fundo-fraco", "C1", "texto em cartão e aviso"),
    ("--texto-forte", "--fundo", "C1", "títulos e links"),
    ("--texto-forte", "--fundo-fraco-hover", "C1", "título com cursor sobre a linha"),
    ("--texto-fraco", "--fundo", "C2", "rótulos, datas e estados"),
    ("--texto-fraco", "--fundo-fraco-hover", "C2", "data com cursor sobre a linha"),
    ("--texto-invertido", "--fundo-forte", "C1", "título do cartão da apresentação"),
    ("--texto-invertido", "--fundo-forte-hover", "C1", "título do cartão com cursor"),
    ("--texto-invertido-fraco", "--fundo-forte", "C2", "legenda do cartão da apresentação"),
    ("--texto-invertido-fraco", "--fundo-forte-hover", "C2", "legenda do cartão com cursor"),
    ("--destaque", "--fundo", "C2", "mensagem de erro"),
    ("--codigo-texto", "--codigo-fundo", "C3", "texto do código"),
    ("--codigo-titulo", "--codigo-barra", "C3", "título da barra do terminal"),
    ("--codigo-titulo", "--codigo-fundo", "C3", "ícone de copiar"),
    *[(f"--sx-{t}", "--codigo-fundo", "C3", f"realce {t}") for t in ("cmd", "kw", "flag", "str", "var", "op", "num", "com", "ok")],
    ("--texto-forte", "--fundo-fraco", "C3", "código em linha"),
    ("--borda", "--fundo", "C4", "contorno de campo e cartão"),
    ("--borda", "--fundo-fraco", "C4", "contorno do cartão sobre seu fundo"),
    ("--codigo-controle", "--codigo-fundo", "C4", "contorno do botão copiar"),
    ("--texto-forte", "--fundo", "C4", "anel de foco"),
    ("--destaque", "--fundo-fraco", "C4", "barra lateral do aviso"),
]
MINIMO = {"C1": 7.0, "C2": 4.5, "C3": 4.5, "C4": 3.0}


def tokens(bloco: str) -> dict[str, str]:
    return dict(re.findall(r"(--[\w-]+)\s*:\s*([^;]+);", bloco))


def temas(css: str) -> dict[str, dict[str, str]]:
    claro = tokens(re.search(r":root\s*\{(.*?)\n\}", css, re.S).group(1))
    escuro_bloco = re.search(r"prefers-color-scheme:\s*dark\).*?\{\s*:root[^{]*\{(.*?)\}", css, re.S).group(1)
    return {"claro": claro, "escuro": {**claro, **tokens(escuro_bloco)}}


def rgba(valor: str) -> tuple[float, float, float, float]:
    valor = valor.strip()
    if valor.startswith("#"):
        h = valor[1:]
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 1.0
    nums = [float(n) for n in re.findall(r"[\d.]+", valor)]
    return nums[0], nums[1], nums[2], nums[3] if len(nums) > 3 else 1.0


def compor(frente: tuple, fundo: tuple) -> tuple[float, float, float]:
    a = frente[3]
    return tuple(frente[i] * a + fundo[i] * (1 - a) for i in range(3))


def luminancia(rgb: tuple[float, float, float]) -> float:
    def canal(c: float) -> float:
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (canal(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def razao(frente: str, fundo: str) -> float:
    f_fundo = rgba(fundo)
    l1 = luminancia(compor(rgba(frente), f_fundo))
    l2 = luminancia(f_fundo[:3])
    claro, escuro = max(l1, l2), min(l1, l2)
    return (claro + 0.05) / (escuro + 0.05)


def tamanhos_pequenos(css: str) -> list[str]:
    """T1: font-size literal abaixo de 13px; em sem piso."""
    ruins = []
    for decl in re.findall(r"font(?:-size)?\s*:\s*([^;}]+)", css):
        if "max(" in decl:
            continue
        for num, unid in re.findall(r"(?<![\w.-])(\d*\.?\d+)(px|rem|em)\b", decl.split("/")[0]):
            px = float(num) * (1 if unid == "px" else 16)
            if (unid == "em" and float(num) < 1) or px < 13:
                ruins.append(decl.strip())
    return ruins


def main() -> int:
    falhas = 0
    pequenos = tamanhos_pequenos(CSS.read_text(encoding="utf-8"))
    print("Tamanho mínimo de texto (T1):", "OK" if not pequenos else "FALHA")
    for decl in pequenos:
        print(f"  [FALHA] T1 font abaixo de 13px: {decl}")
    falhas += len(pequenos)
    for nome, cores in temas(CSS.read_text(encoding="utf-8")).items():
        print(f"\nTema {nome}")
        for frente, fundo, regra, descricao in PARES:
            if frente not in cores or fundo not in cores:
                print(f"  [FALTA] {frente} / {fundo}")
                falhas += 1
                continue
            r = razao(cores[frente], cores[fundo])
            ok = r >= MINIMO[regra]
            falhas += not ok
            print(f"  [{'OK' if ok else 'FALHA'}] {regra} {r:5.2f}:1 (mín. {MINIMO[regra]}) {descricao}: {frente} sobre {fundo}")
    print("\nContraste aprovado." if not falhas else f"\n{falhas} par(es) abaixo do mínimo.")
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
