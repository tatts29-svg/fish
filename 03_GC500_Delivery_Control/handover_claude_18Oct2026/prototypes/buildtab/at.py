import sys
# usage: at.py file.html LINE COL [before] [after]
f,L,C=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]); b=int(sys.argv[4]) if len(sys.argv)>4 else 200; a=int(sys.argv[5]) if len(sys.argv)>5 else 600
with open(f,encoding='utf-8') as fh:
    for i,line in enumerate(fh):
        if i==L:
            print(line[max(0,C-b):C+a]); break
