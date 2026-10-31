"""Verify the Equation Pyramid rule interpretation against the 10 real rounds (namu.wiki day 6)."""
from fractions import Fraction
from itertools import permutations
import random

ROUNDS = [
    # (cells A..J as (op, n)), target, official answers
    ("×7 ÷5 +9 −5 ×2 +2 ÷8 ÷3 −8 ×3", 10, "ACH BJD CEI DBC IGC JHC"),
    ("÷4 +8 ×2 −3 +9 +1 ×7 ÷11 −6 ×8", 1, "FGI GDC"),
    ("+7 ÷9 ×2 −13 +15 ÷5 ×1 ÷3 −11 ×3", 8, "AJD JEH JHA"),
    ("×3 ×13 −8 −14 ÷2 ÷7 ×9 ÷5 −1 ÷4", 11, "BCJ BDF DIA JAI"),
    ("÷14 ÷2 −10 ÷7 ×8 ÷5 ÷12 −5 −6 ÷4", 6, "BEC DHF ECF"),
    ("÷9 −2 −10 ×6 ×3 −8 ×2 ×5 ÷7 ×4", 3, "ABE IBG"),
    ("−1 +2 +3 −4 ×5 ×6 ×7 −8 ×9 −10", 19, "ABI ACF CIH DCE DEA EBG GBF IBE"),
    ("−16 −14 ÷2 ÷8 ×12 ×4 ÷7 +10 +3 ÷5", 9, "ABC ECI FHC GHJ"),
    ("−2 +12 ÷6 ×4 ÷2 +8 ×6 ÷10 −4 ×2", 7, "FAE"),
    ("−10 ×4 ×9 ×5 ×2 +3 +1 ÷6 ÷8 ÷7", 17, "DFB EFD FCA IEG IGC JEF"),
]
L = "ABCDEFGHIJ"


def parse(s):
    out = []
    for tok in s.split():
        op, n = tok[0], int(tok[1:])
        out.append(({"×": "*", "÷": "/", "+": "+", "−": "-"}[op], n))
    return out


def evaluate(cells, idx, integer_only):
    """First cell's sign is ignored. Standard precedence (× ÷ before + −)."""
    (_, a), (op1, b), (op2, c) = cells[idx[0]], cells[idx[1]], cells[idx[2]]
    a, b, c = Fraction(a), Fraction(b), Fraction(c)

    def ap(x, op, y):
        if op == "+": return x + y
        if op == "-": return x - y
        if op == "*": return x * y
        if y == 0: return None
        r = x / y
        if integer_only and r.denominator != 1: return None
        return r

    hi = {"*", "/"}
    if op2 in hi and op1 not in hi:
        t = ap(b, op2, c)
        if t is None: return None
        return ap(a, op1, t)
    t = ap(a, op1, b)
    if t is None: return None
    return ap(t, op2, c)


def solve(cells, target, integer_only):
    sols = []
    for p in permutations(range(10), 3):
        v = evaluate(cells, p, integer_only)
        if v is not None and v == target:
            sols.append("".join(L[i] for i in p))
    return sols


if __name__ == "__main__":
    for mode in (False, True):
        print("== integer_only =", mode)
        allmatch = True
        for k, (s, t, ans) in enumerate(ROUNDS, 1):
            cells = parse(s)
            got = sorted(solve(cells, t, mode))
            want = sorted(ans.split())
            ok = got == want
            allmatch &= ok
            print(f"R{k:2d} target={t:3d} n={len(got)} official={len(want)} {'OK' if ok else 'DIFF'}",
                  "" if ok else f"extra={sorted(set(got)-set(want))} missing={sorted(set(want)-set(got))}")
        print("ALL MATCH" if allmatch else "MISMATCH")

    # How rare is a "good" random puzzle? Generate random boards the show's way and count solutions.
    random.seed(1)
    ops = ["+", "-", "*", "/"]
    stats = {}
    trials = 20000
    for _ in range(trials):
        cells = [(random.choice(ops), random.randint(1, 16)) for _ in range(10)]
        t = random.randint(1, 20)
        n = len(solve(cells, t, False))
        stats[n] = stats.get(n, 0) + 1
    print("random boards (ops uniform, n in 1..16, target 1..20): #solutions distribution")
    for n in sorted(stats):
        print(n, stats[n])
