#!/usr/bin/python3
from sys import stderr
from random import randrange
from time import sleep

num = input()
#print("I'm {} apparently".format(num), file=stderr)
turn = 0
while True:
    data = '\n'.join(input() for _ in range(6))
    for i in range(1000):
        print("turn", turn, file=stderr)
    turn+=1
    print(randrange(7))
