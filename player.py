#!/usr/bin/python3
from sys import stderr
from random import randrange
from time import sleep

num = input()
#print("I'm {} apparently".format(num), file=stderr)
while True:
    data = '\n'.join(input() for _ in range(6))
    sleep(0.1)
    print(randrange(7))
