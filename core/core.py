#!/usr/bin/python3

from subprocess import Popen, PIPE
from sys import argv
from utils import *
from game.game import Game
from random import random
from pwd import getpwnam as userInfo
from os import setgid, setuid
from signal import SIGTERM

def demote(user='nobody'):
    pw_record = userInfo(user)
    user_name = pw_record.pw_name
    user_home = pw_record.pw_dir
    user_uid  = pw_record.pw_uid
    user_gid  = pw_record.pw_gid
    def wrapper():
        setgid(user_gid)
        setuid(user_uid)
    return wrapper

class Player:
    def __init__(self, ai, id):
        self.id = id
        self.baseName = ai.name
        self.name = 'IA[{}, {}]'.format(id, ai.name)
        cwd, cmd = ai.execute()
        self.proc = Popen(cmd, preexec_fn=demote(), cwd=cwd, shell=True, stdin=PIPE, stdout=PIPE, stderr=PIPE)
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
    def kill(self, collectLogs=False, t=0.1):
        self.proc.kill()
        sleep(t)
        if self.proc.poll() is None:
            print('Fight didn\'t end properly', self.proc.pid)
        if collectLogs:
            self.logEntry(''.join(thread(1, self.error, otherwise='')()))


#========================================#
#                  MAIN                  #
#========================================#
def fight(ai1, ai2):
    player1 = Player(ai1, 1)
    player2 = Player(ai2, 2)

    game  = Game(ai1.name, ai2.name)
    error = 0
    turn  = 0
    while not game.winner and not error:
        turn += 1
        for player in (player1, player2):
            start = time()
            try:
                player.newLogEntry('[Turn {}]: {} '.format(turn, player.baseName))
                try:
                    if turn == 1:
                        player.send(player.id)
                    player.send(game.showBoard())
                    data = thread(1, player.listen)()
                    errorIf(player.poll() is not None, error=ErrorWithMessage('Program stopped...'))
                    player.logEntry('played: "{}",'.format(data))
                except Exception as E:
                    player.logEntry('ended')
                    raise E
                finally:
                    player.logEntry(' after {:.5f}s.\n'.format(time()-start))
                    player.collectLogs()
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
                else:
                    print("//////////////////////////////////////////")
                    print("//////////////////////////////////////////")
                    print(E)
                    print("//////////////////////////////////////////")
                    print("//////////////////////////////////////////")
                    player.logEntry(str(E))
                break
    player1.kill()
    player2.kill()
    return (game, player1, player2)

if __name__ == '__main__':
    class AIdemo:
        def __init__(self, cmd):
            self.name = 'demo'
            self.cmd = cmd
        def execute(self):
            return self.cmd
    fight(AIdemo(argv[1]), AIdemo(argv[2]))
