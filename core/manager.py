#!/usr/bin/python3

import pymysql as sql
from json import load as fromJson, dumps as toJson
from time import sleep, time
from threading import Thread, RLock
from multiprocessing import Queue
from requests import post as callApp
from sys import exit

from works import *
from hook import *
from tournament import *

lock = RLock()
class Worker(Thread):
    def __init__(self, workerId, db, callback, signalEnd):
        self.id = workerId
        self.db = db
        self.working = False
        self.user = None
        self.requestId = None
        self.work = None
        self.callback = callback
        self.signalEnd = signalEnd
    def run(self):
        start = time()
        exitCode, field0, field1, field2 = self.work.process()
        with lock:
            print('FINISH', self.requestId, time()-start)
            with self.db.cursor() as cursor:
                cursor.execute('INSERT INTO Results(id, cmd, exitCode, field0, field1, field2) VALUES(%s, %s, %s, %s, %s, %s)', (self.requestId, self.work.id, exitCode, field0, field1, field2))
                if self.work.sql and exitCode == 0:
                    for stmt, inserts in zip(self.work.sql, self.work.inserts):
                        cursor.execute(stmt, inserts)
        self.callback(self.requestId, exitCode, field0, field1, field2)
        self.signalEnd(self.id)
    def give(self, user, requestId, work):
        if self.working:
            raise Exception
        self.working = True
        self.user = user
        self.requestId = requestId
        self.work = work
        Thread.__init__(self)
        self.start()

class WorkerManager:
    def __init__(self, nbWorkers, db, tournament, signalEnd):
        self.tournament = tournament
        self.nbWorkers = nbWorkers
        self.workers = [Worker(workerId, db, tournament.callback, signalEnd) for workerId in range(nbWorkers)]
        self.users = set()
    def newWork(self, line):
        user = line[5]
        if user != '$ROOT' and (self.tournament.running or user in self.users):
            return False
        for worker in self.workers:
            if not worker.working:
                worker.give(user, line[0], work(line))
                if user != '$ROOT': self.users.add(user)
                return True
        return False
    def end(self, workerId):
        worker = self.workers[workerId]
        worker.working = False
        worker.join()
        if worker.user != '$ROOT': self.users.remove(worker.user)
        try:
            callApp(url='http://{}:{}/result'.format(config['web']['addr'], config['web']['port']), data={'id':worker.requestId})
        except Exception:
            print('Please start app.js first')
            exit(-1)

class Poller:
    def __init__(self, config):
        #Config
        self.config = config
        configDB = config['db']
        configCore = config['core']
        #DB
        self.db = sql.connect(host=configDB['host'],
                user=configDB['user'],
                passwd=configDB['password'],
                db=configDB['database'],
                autocommit=True)
        self.cursor = self.db.cursor()
        #Tournament and Worker Managers
        self.tournament = Tournament(self)
        self.cursor.execute('SELECT MAX(id) AS id FROM Results')
        self.factory = WorkerManager(configCore['nbWorkers'], self.db, self.tournament, self.signalPoll)
        #Reload state
        self.reload()
        #Link with app
        self.resQueue = Queue()
        self.listener = Listener(configCore['addr'], configCore['port'])
        self.listener.bind('/event', self.signalPoll)
        self.listener.bind('/tournament', self.tournament.start)
        self.listener.start()

    def reload(self):
        self.cursor.execute('SELECT * FROM Agents')
        for line in self.cursor.fetchall():
            print(line)
            author, name, lang, status, date = line
            ai = AI(author, name, lang, status)
            if status == 2:
                ai.execute = lambda: ('game', self.config['core']['boss'])
            ai.register(False)

    def signalPoll(self, workerId = None):
        self.resQueue.put(workerId)

    def poll(self):
        while True:
            with lock:
                self.cursor.execute('SELECT * FROM Requests WHERE state = 0')
                lines = self.cursor.fetchall()
                pollSize = len(lines)
                print("Polling[{}]".format(pollSize))
                for line in lines:
                    if self.factory.newWork(line):
                        self.cursor.execute('UPDATE Requests SET state = 1 WHERE id = %s', (line[0],))
            print('\nWAITING')
            workerId = self.resQueue.get()
            print('GOT', workerId, 'IN QUEUE')
            if workerId is not None:
                self.factory.end(workerId)

if __name__ == '__main__':
    dbDir = '../db'
    dbConfigFile = '{}/secret.json'.format(dbDir)
    with open(dbConfigFile) as f:
        config = fromJson(f)
    poller = Poller(config)
    poller.poll()
