W = dict(R=2, P=7, Y=10, B=16, G=19)
def wt(s):
    tot = 0
    for tok in s.split():
        tot += W[tok[0]] * int(tok[1:])
    return tot
def sign(a, b):
    return ">" if a > b else "<" if a < b else "="
rows = [
 (1, "Y1", "R1", ">", "G1", "B1", ">"),
 (2, "Y1 P1", "R1 Y1", ">", "R1 G1", "R1 B1", ">"),
 (3, "Y1 P1", "R2 Y1", ">", "R1 G1", "R2 B1", ">"),
 (4, "Y1 P1", "R3 Y1", ">", "R1 G1", "R2 B2", "<"),
 (5, "Y1 P1", "R4 Y1", "<", "R1 G2", "R2 B2", ">"),
 (7, None, None, None, "R2 G2 P1", "R2 B2 P1", ">"),
 (8, "Y1 B2 P1", "R4 Y1 G1", ">", "R2 G2 P1", "R2 Y1 B2 P1", "<"),
 (9, "Y1 B2 P1", "R4 Y2 G1", ">", "R2 G2 P2", "R2 Y1 B2 P1", ">"),
 (11, "Y1 B2 P1", "R4 Y2 G1", ">", "R2 Y1 G2 P3", "R2 Y2 B3 P2", ">"),
 (12, "Y1 B2 P1", "R4 Y2 G1 P1", "<", "R2 Y1 G2 P4", "R2 Y2 B3 P2", "<"),
 (13, "Y1 B2 P1", "R4 Y2 G1 P1", "<", "R3 Y2 G2 P4", "R2 Y2 B3 P2", ">"),
 (14, "Y1 B2 P2", "R4 Y2 G1 B1 P1", "<", "R3 Y2 G2 P4", "R2 Y2 B3 P2", ">"),
 (15, "Y1 B2 P2", "R4 Y2 G1 B1 P1", "<", "R3 Y2 G2 P4", "R3 Y2 B3 P3", "<"),
 (16, "Y1 G1 B2 P2", "R4 Y2 G1 B1 P1", ">", "R3 Y2 G3 P4", "R3 Y2 B3 P3", ">"),
 (17, "Y1 G1 B2 P2", "R4 Y2 G1 B1 P1", ">", "R3 Y2 G3 P4", "R3 Y2 B4 P4", "<"),
 (18, "Y1 G1 B2 P2", "R4 Y2 G1 B1 P1", ">", "R3 Y2 G3 B1 P5", "R3 Y2 G2 B4 P4", "<"),
 (19, "Y1 G1 B2 P2", "R4 Y2 G1 B2 P1", "<", "R4 Y2 G3 B1 P5", "R3 Y2 G2 B4 P4", "<"),
 (20, "Y1 G1 B2 P2", "R4 Y2 G1 B2 P1", "<", "R4 Y2 G3 B3 P5", "R3 Y2 G3 B4 P4", "<"),
 (21, "R1 Y1 G1 B2 P2", "R4 Y2 G1 B2 P1", "<", "R4 Y3 G3 B3 P5", "R3 Y2 G3 B4 P4", ">"),
 (22, "R1 Y1 G1 B2 P3", "R4 Y2 G1 B2 P1", "<", "R4 Y3 G3 B3 P5", "R3 Y2 G4 B4 P4", "<"),
 (23, "R1 Y1 G1 B3 P3", "R4 Y2 G1 B2 P1", ">", "R4 Y3 G3 B4 P5", "R3 Y2 G4 B4 P4", "="),
 (24, "R1 Y1 G1 B3 P3", "R4 Y2 G1 B2 P1", ">", "R4 Y3 G4 B4 P5", "R3 Y2 G5 B4 P4", "="),
 (25, "R1 Y1 G1 B3 P3", "R5 Y3 G1 B2 P1", ">", None, None, None),
 (26, "R1 Y1 G1 B4 P3", "R5 Y3 G2 B2 P1", ">", None, None, None),
 (27, "R1 Y1 G1 B4 P3", "R5 Y3 G3 B2 P2", "<", None, None, None),
 (28, "R1 Y2 G2 B4 P3", "R5 Y3 G3 B2 P2", "<", None, None, None),
 (29, "R1 Y2 G2 B4 P3", "R5 Y5 G3 B2 P2", "<", None, None, None),
]
bad = []
for t, ml, mr, ms, al, ar, a_s in rows:
    if ml:
        s = sign(wt(ml), wt(mr))
        if s != ms: bad.append((t, "main", wt(ml), wt(mr), "namu", ms, "calc", s))
    if al:
        s = sign(wt(al), wt(ar))
        if s != a_s: bad.append((t, "aux", wt(al), wt(ar), "namu", a_s, "calc", s))
print("mismatches:", bad)
