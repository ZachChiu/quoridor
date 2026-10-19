import sys, time
sys.setrecursionlimit(10000)
MOVES = [(1,2),(2,1),(2,-1),(1,-2),(-1,-2),(-2,-1),(-2,1),(-1,2)]
def solve(n, start, limit=200000):
    """Warnsdorff-ordered backtracking for an open tour. Returns path or None (None also on node limit)."""
    board = [[0]*n for _ in range(n)]
    path = [start]; board[start[0]][start[1]] = 1
    nodes = [0]
    def deg(r, c):
        return sum(1 for dr, dc in MOVES if 0 <= r+dr < n and 0 <= c+dc < n and not board[r+dr][c+dc])
    def rec(r, c, k):
        if k == n*n: return True
        nodes[0] += 1
        if nodes[0] > limit: raise TimeoutError
        cand = [(deg(r+dr, c+dc), r+dr, c+dc) for dr, dc in MOVES if 0 <= r+dr < n and 0 <= c+dc < n and not board[r+dr][c+dc]]
        cand.sort()
        for _, nr, nc in cand:
            board[nr][nc] = k+1; path.append((nr, nc))
            if rec(nr, nc, k+1): return True
            board[nr][nc] = 0; path.pop()
        return False
    try:
        return path if rec(start[0], start[1], 1) else None, nodes[0]
    except TimeoutError:
        return "timeout", nodes[0]
for n in (5, 6, 7, 8):
    ok = 0; imp = 0; to = 0; maxnodes = 0; t0 = time.time()
    for r in range(n):
        for c in range(n):
            res, nodes = solve(n, (r, c))
            maxnodes = max(maxnodes, nodes)
            if res == "timeout": to += 1
            elif res: ok += 1
            else: imp += 1
    print(f"{n}x{n}: start squares with a tour={ok}, proven impossible={imp}, timeout={to}, max nodes={maxnodes}, {time.time()-t0:.1f}s")
