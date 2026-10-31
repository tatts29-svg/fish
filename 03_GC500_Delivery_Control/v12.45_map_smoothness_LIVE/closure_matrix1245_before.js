function satMatrix(){ const M = GEO.Ai; return 'matrix(' + [M[0][0], M[1][0], M[0][1], M[1][1], M[0][2], M[1][2]].map(n => Number(n).toPrecision(12)).join(' ') + ')'; }
