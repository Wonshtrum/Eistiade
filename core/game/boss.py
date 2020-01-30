from random import randrange

input()
while 1:
    top = input().split()
    for _ in range(5):input()
    x = randrange(7)
    c = 0
    while top[x] != '.':
        x = randrange(7)
        c = c+1
        if c > 10:
            raise Exception('Fuck it')
    print(x)
