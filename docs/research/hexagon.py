# Hexagon (Devil's Plan S1 final 2) board model: rows 3-4-5-4-3, letters A..S
rows = [list("ABC"), list("DEFG"), list("HIJKL"), list("MNOP"), list("QRS")]
# axial coords: use cube coordinates for a radius-2 hexagon
coord = {}
for r, row in enumerate(rows):
    q0 = max(-2, -2 - (r - 2))  # leftmost q for row r (r-2 in -2..2)
    rr = r - 2
    q_start = -2 - rr if rr < 0 else -2
    q_start = max(-2, -2 - rr)
    for i, ch in enumerate(row):
        q = q_start + i
        coord[ch] = (q, rr)
pos = {v: k for k, v in coord.items()}
dirs = [(1, 0), (0, 1), (-1, 1)]  # three line directions
lines = []
for ch, (q, r) in coord.items():
    for dq, dr in dirs:
        cells = [(q + k * dq, r + k * dr) for k in range(3)]
        if all(c in pos for c in cells):
            lines.append("".join(pos[c] for c in cells))
print(len(lines), "lines")
boards = {
 1: ("1 6 3 2 4 5 6 2 5 2 1 3 4 5 3 5 1 1 3", 5, ["QRS","ADH"], ["HIJ","IJK"]),
 2: ("2 3 2 6 5 4 1 4 3 7 4 4 2 1 1 5 6 2 2", 7, ["NOP","ROK"], []),
 3: ("4 3 3 1 2 1 4 5 2 3 5 1 3 5 2 2 2 3 3", 6, [], ["FGL","CGL"]),
 4: ("6 1 2 3 5 6 2 3 4 3 1 5 3 2 3 4 6 4 3", 9, ["NOP","JKL","JOS"], ["ROK","JOS"]),
 5: ("3 1 2 6 3 7 2 4 2 2 3 6 7 3 4 1 5 6 1", 8, ["HIJ","LPS","AEJ"], ["EIM","CGL"]),
 6: ("2 3 5 4 4 5 1 2 8 3 5 4 4 5 7 2 8 1 1", 12, ["JKL"], []),
 7: ("6 5 2 4 3 4 2 2 5 5 3 6 7 5 1 4 1 1 2", 10, ["NOP","HMQ"], []),
 8: ("6 7 5 5 1 10 10 4 4 6 8 6 10 9 1 1 4 2 10", 18, ["HMQ","IJK"], []),
 9: ("4 7 1 4 3 3 5 6 3 2 5 2 2 6 1 1 1 2 5", 11, ["EFG","GKO","NJF","HIJ"], []),
 10:("5 6 5 7 8 1 6 4 4 2 3 3 4 6 6 7 4 1 8", 15, ["AEJ"], ["DEF"]),
}
letters = "ABCDEFGHIJKLMNOPQRS"
norm = lambda s: s if s <= s[::-1] else s[::-1]
lineset = {norm(l) for l in lines}
tot = 0
for rnd, (nums, target, correct, wrong) in boards.items():
    v = dict(zip(letters, map(int, nums.split())))
    sols = sorted(norm(l) for l in lineset if sum(v[c] for c in l) == target)
    tot += len(sols)
    ok = all(norm(c) in sols for c in correct)
    found = {norm(c) for c in correct}
    print(f"R{rnd:2d} target {target:2d}: {len(sols)} solutions {sols} | show found {len(found)} | all called-correct valid: {ok} | missed {sorted(set(sols)-found)} | wrong calls valid-line? {[ (w, norm(w) in lineset) for w in wrong]}")
print("avg solutions/round", tot/10)
