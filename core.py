#!/usr/bin/python3

import subprocess as sp
from multiprocessing import Process, Queue
from sys import argv
from utils import *
from game import Game
import os
from traceback import print_exc as stackException

print(os.getenv('USER'))

class Player:
    def __init__(self, path, id):
        self.id = id
        self.name = 'IA[{0}, {1}]'.format(id, path)
        self.proc = sp.Popen('sudo -u nobody ./{0}'.format(path), shell=True, stdin=sp.PIPE, stdout=sp.PIPE, stderr=sp.PIPE)
    def send(self, data):
        self.proc.stdin.write('{0}\n'.format(data).encode())
        self.proc.stdin.flush()
    def listen(self):
        return self.proc.stdout.readline().decode()[:-1]
    def error(self):
        return self.proc.stderr.read().decode()[:-1]
    def logs(self):
        for line in self.proc.stderr:
            yield line.decode()
    def kill(self):
        self.proc.terminate()


#========================================#
#                  MAIN                  #
#========================================#
player1 = Player(argv[1], 1)
player2 = Player(argv[2], 2)
player1.send('1')
player2.send('2')

game = Game()
error = 0
while not game.winner and not error:
    for player in (player1, player2):
        start = time()
        try:
            print(game.showBoard())
            player.send(game.showBoard())
            data = thread(1, player.listen)()
            print(''.join(thread(0.01, player.logs, wait=True, otherwise='Nothing to show')()))
            errorIf(data == '')
            print('{0}: {1} ({2})'.format(player.name, data, time()-start))
            try:
                game.play(player.id, data)
            except Exception as E:
                error = 'Invalid move: {}\nServer info: {}'
                if type(E) == ErrorWithMessage:
                    raise ErrorWithMessage(error.format(data, E.msg))
                else:
                    raise ErrorWithMessage(error.format(data, 'No more info...'))
            if game.checkWin(player.id):
                break
        except Exception as E:
            player1.kill()
            player2.kill()
            game.winner = 3-player.id
            if type(E) == ErrorWithMessage:
                error = E.msg
            else:
                error = "Internal player error"
            print("===============", player.name)
            print(error)
            print("=============== AFTER:", time()-start)
            break

for player in (player1, player2):
    print('')
    print(player.name)
    print(''.join(thread(1, player.error, otherwise='Nothing to show')()))

print(game.showBoard())
print('\nWinner: {0}'.format(game.winner))
