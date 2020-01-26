#!/usr/bin/python3

import pymysql as sql
from json import load as fromJson
from time import sleep, time
from threading import Thread, RLock
from works import *
from hook import *
from requests import post as callApp

lock = RLock()
class Worker(Thread):
    def __init__(self, workerId, db, callback):
        self.id = workerId
        self.db = db
        self.working = False
        self.requestId = None
        self.work = None
        self.callback = callback
    def run(self):
        start = time()
        exitCode, field0, field1, field2 = self.work.process()
        with lock:
            print('FINISH', self.id, time()-start)
            with self.db.cursor() as cursor:
                cursor.execute('INSERT INTO Results VALUES(%s, %s, %s, %s, %s, %s)', (self.requestId, self.work.id, exitCode, field0, field1, field2))
                if self.work.sql and exitCode == 0:
                    cursor.execute(self.work.sql, self.work.inserts)
        self.working = False
        self.callback(self.requestId)
    def give(self, requestId, work):
        if self.working:
            raise Exception
        self.working = True
        self.requestId = requestId
        self.work = work
        Thread.__init__(self)
        self.start()

class WorkerManager:
    def __init__(self, nbWorkers, db, callback):
        self.nbWorkers = nbWorkers
        self.workers = [Worker(workerId, db, callback) for workerId in range(nbWorkers)]
    def newWork(self, requestId, work):
        for worker in self.workers:
            if not worker.working:
                worker.give(requestId, work)
                return True
        return False

class Poller:
    def __init__(self, config):
        self.db = sql.connect(host=config['host'],
                user=config['user'],
                passwd=config['password'],
                db=config['database'],
                autocommit=True)
        self.cursor = self.db.cursor()
        self.cursor.execute('SELECT MAX(id) AS id FROM Results')
        self.factory = WorkerManager(config['nbWorkers'], self.db, self.endWork)
        self.lastIndex = self.cursor.fetchone()[0] or 0
        print('LastRequest:', self.lastIndex)
        self.reload()
        self.listener = Listener(port=config['linkPort'])
        self.listener.bind('/event', self.poll)
        self.listener.start()

    def reload(self):
        self.cursor.execute('SELECT * FROM Agents')
        for line in self.cursor.fetchall():
            print(line)
            author, name, lang, status = line
            ai = AI(author, name, lang)
            ai.register(False)

    def endWork(self,requestId):
        callApp(url='http://localhost:8080/result', data={'id':requestId})
        self.poll()

    def poll(self):
        with lock:
            self.cursor.execute('SELECT * FROM Requests WHERE id > %s', (self.lastIndex,))
            lines = self.cursor.fetchall()
            print("Polling[{}]".format(len(lines)))
            for line in lines:
                if self.factory.newWork(line[0], work(line)):
                    self.lastIndex = line[0]
                    print(line[0])
                else:
                    break

if __name__ == '__main__':
    dbDir = '../db'
    dbConfigFile = '{}/secret.json'.format(dbDir)
    with open(dbConfigFile) as f:
        config = fromJson(f)
    Poller(config)
