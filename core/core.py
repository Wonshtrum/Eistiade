#!/usr/bin/python3

from subprocess import Popen, PIPE
from sys import argv
from utils import *
from game import Game

class Player:
    def __init__(self, ai, id):
        self.id = id
        self.name = 'IA[{}, {}]'.format(id, ai.name)
        self.proc = Popen(ai.execute(), shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE)
        self.logHistory = []
    def send(self, data):
        self.proc.stdin.write('{}\n'.format(data).encode())
        self.proc.stdin.flush()
    def listen(self):
        return self.proc.stdout.readline().decode()[:-1]
    def error(self):
        return self.proc.stderr.read().decode()[:-1]
    def logs(self):
        for line in self.proc.stderr:
            yield line.decode()
    def logEntry(self, entry):
        if not self.logHistory:
            self.logHistory = ['']
        self.logHistory[-1] += entry
    def collectLogs(self, t=0.02):
        self.logEntry(''.join(thread(t, self.logs, wait=True, otherwise='')()))
    def newLogEntry(self, entry = ''):
        self.logHistory.append(entry)
    def printLogs(self):
        for log in self.logHistory:
            print(log, end='')
    def poll(self):
        return self.proc.poll()
    def kill(self, collectLogs=False):
        self.proc.terminate()
        if collectLogs:
            self.logEntry(''.join(thread(1, self.error, otherwise='')()))


#========================================#
#                  MAIN                  #
#========================================#
def fight(ai1, ai2):
    player1 = Player(ai1, 1)
    player2 = Player(ai2, 2)
    player1.send('1')
    player2.send('2')

    game  = Game()
    error = 0
    turn  = 0
    while not game.winner and not error:
        turn += 1
        for player in (player1, player2):
            start = time()
            try:
                print(game.showBoard())
                player.newLogEntry('-------------[{}]'.format(turn))
                player.send(game.showBoard())
                try:
                    data = thread(1, player.listen)()
                    errorIf(player.poll() is not None)
                    player.logEntry(': "{}"'.format(data))
                finally:
                    player.logEntry(' AFTER: {}\n'.format(time()-start))
                    player.collectLogs()
                print('{}: {} ({})'.format(player.name, data, time()-start))
                try:
                    game.play(player.id, data)
                except Exception as E:
                    error = 'Invalid move\nServer info: {}'
                    if type(E) == ErrorWithMessage:
                        raise ErrorWithMessage(error.format(E.msg))
                    else:
                        raise ErrorWithMessage(error.format('No more info...'))
                if game.checkWin(player.id):
                    break
            except Exception as E:
                player1.kill()
                player2.kill()
                game.win(3-player.id)
                if type(E) == ErrorWithMessage:
                    player.logEntry(E.msg)
                break

    for player in (player1, player2):
        player.kill()
        print('\n\n{} =============================================='.format(player.name))
        player.printLogs()

    print('\n\n[FINAL STATE] ==============================================')
    print(game.showBoard())
    print('\nWinner: {}'.format(game.winner))
    return (game, player1, player2)

if __name__ == '__main__':
    class AIdemo:
        def __init__(self, cmd):
            self.name = 'demo'
            self.cmd = cmd
        def execute(self):
            return self.cmd
    fight(AIdemo(argv[1]), AIdemo(argv[2]))
