"""Balance Mancala engine sketch + greedy-agent simulation (rules from namu.wiki day 5 rule card).

Ring (clockwise): 0=Devil, 1..6 = dishes 01..06, 7=Angel, 8..13 = dishes 07..12.
Colours: 01 R, 02 B, 03 G, 04 R, 05 B, 06 G, 07 R, 08 B, 09 G, 10 R, 11 B, 12 G.
"""
import random, statistics, itertools

DEVIL, ANGEL = 0, 7
COLOR = {1: 0, 2: 1, 3: 2, 4: 0, 5: 1, 6: 2, 8: 0, 9: 1, 10: 2, 11: 0, 12: 1, 13: 2}  # 0=R 1=B 2=G
N_POS = 14


def final_score(s):
    return 2 * min(s) - max(s)


def setup(n_players, pieces_each, rng, neutral=0):
    board = [[] for _ in range(N_POS)]
    order = []
    for _ in range(pieces_each):
        order += list(range(n_players))
    order += [-1] * neutral  # neutral pieces (score for nobody)
    for p in order:
        legal = [i for i in range(N_POS) if len(board[i]) < 2]
        board[rng.choice(legal)].append(p)
    return board


def apply_move(board, scores, mover, src, seq, rng_color_choice=None):
    """seq: owners in the order they are dropped (len == len(board[src]))."""
    b = [list(x) for x in board]
    sc = [list(x) for x in scores]
    k = len(b[src]); assert sorted(seq) == sorted(b[src])
    b[src] = []
    pos = src
    for owner in seq:
        pos = (pos + 1) % N_POS
        b[pos].append(owner)
    last_owner, cnt = seq[-1], len(b[pos])
    if last_owner >= 0:
        s = sc[last_owner]
        if pos == ANGEL or pos == DEVIL:
            target = min(s) if pos == ANGEL else max(s)
            choices = [c for c in range(3) if s[c] == target]
            c = choices[0] if rng_color_choice is None else rng_color_choice(choices)
        else:
            c = COLOR[pos]
        s[c] += cnt
    return b, sc, pos, last_owner, cnt


def candidate_moves(board, mover, rng, max_perms=12):
    """Enumerate (src, seq) moves: every src with own piece; for the last piece try each distinct owner;
    other pieces in a few random orders (the full permutation space is too big to enumerate)."""
    out = []
    for src in range(N_POS):
        if mover not in board[src]:
            continue
        pieces = board[src]
        for last in set(pieces):
            rest = list(pieces); rest.remove(last)
            seen = set()
            for _ in range(max_perms):
                rng.shuffle(rest)
                t = tuple(rest)
                if t in seen: continue
                seen.add(t)
                out.append((src, list(t) + [last]))
    return out


def greedy_choice(board, scores, mover, rng, n_players):
    best, best_v = None, -1e9
    for src, seq in candidate_moves(board, mover, rng):
        b, sc, pos, lo, cnt = apply_move(board, scores, mover, src, seq)
        ended = any(max(s) >= 30 for s in sc[:n_players])
        mine = final_score(sc[mover])
        others = [final_score(sc[i]) for i in range(n_players) if i != mover]
        if ended:
            v = 1000 if mine > max(others) else -1000 + mine
        else:
            # value: my balance + growth toward 16+, minus leader's balance
            v = mine + 0.35 * min(sc[mover]) - 0.25 * max(others)
            # mobility: number of distinct dishes holding my pieces
            v += 0.3 * sum(1 for x in b if mover in x)
        v += rng.random() * 0.01
        if v > best_v:
            best, best_v = (src, seq), v
    return best


def play(n_players, pieces_each, rng, neutral=0, agent="greedy", max_turns=600):
    board = setup(n_players, pieces_each, rng, neutral)
    scores = [[0, 0, 0] for _ in range(n_players)]
    turn = 0
    while turn < max_turns:
        mover = turn % n_players
        if agent == "random":
            cm = candidate_moves(board, mover, rng, max_perms=1)
            src, seq = rng.choice(cm)
        else:
            src, seq = greedy_choice(board, scores, mover, rng, n_players)
        board, scores, *_ = apply_move(board, scores, mover, src, seq)
        turn += 1
        if any(max(s) >= 30 for s in scores):
            break
    finals = [final_score(s) for s in scores]
    return turn, finals, scores


if __name__ == "__main__":
    rng = random.Random(7)
    configs = [(7, 4, 0), (4, 7, 0), (4, 4, 0), (4, 5, 8), (5, 5, 3), (3, 7, 7), (2, 7, 14)]
    for agent in ("random", "greedy"):
        print("== agent:", agent)
        for n, pe, neu in configs:
            turns, best, worst, over15 = [], [], [], 0
            G = 150 if agent == "greedy" else 400
            for _ in range(G):
                t, finals, sc = play(n, pe, rng, neu, agent)
                turns.append(t); best.append(max(finals)); worst.append(min(finals))
                over15 += any(f > 15 for f in finals)
            print(f"  {n}p x {pe} pieces (+{neu} neutral): turns median {statistics.median(turns):.0f} "
                  f"(rounds ~{statistics.median(turns)/n:.1f}), winner score median {statistics.median(best):.0f}, "
                  f"last place median {statistics.median(worst):.0f}, games with someone >15: {over15/G:.0%}")
