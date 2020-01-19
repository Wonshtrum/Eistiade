#!/usr/bin/python3

import pymysql as sql
from json import load as fromJson
from time import sleep, time
from threading import Thread, RLock
from works import *

lock = RLock()
class Worker(Thread):
    def __init__(self, workerId, db):
        self.id = workerId
        self.db = db
        self.working = False
        self.requestId = None
        self.work = None
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
    def give(self, requestId, work):
        if self.working:
            raise Exception
        self.working = True
        self.requestId = requestId
        self.work = work
        Thread.__init__(self)
        self.start()

class WorkerManager:
    def __init__(self, nbWorkers, db):
        self.nbWorkers = nbWorkers
        self.workers = [Worker(workerId, db) for workerId in range(nbWorkers)]
    def newWork(self, requestId, work):
        for worker in self.workers:
            if not worker.working:
                worker.give(requestId, work)
                return True
        return False

def reload(db):
    with db.cursor() as cursor:
        cursor.execute('SELECT * FROM Agents')
        for line in cursor.fetchall():
            print(line)
            author, name, lang, status = line
            ai = AI(author, name, lang)
            ai.register(False)

def polling(config):
    db = sql.connect(host=config['host'],
            user=config['user'],
            passwd=config['password'],
            db=config['database'],
            autocommit=True)
    reload(db)
    factory = WorkerManager(config['nbWorkers'], db)
    interval = config['interval']/1000
    with db.cursor() as cursor:
        cursor.execute('SELECT MAX(id) AS id FROM Results')
        lastIndex = cursor.fetchone()[0] or 0
        print(lastIndex)
        while True:
            sleep(interval)
            cursor.execute('SELECT * FROM Requests WHERE id > %s', (lastIndex,))
            lines = cursor.fetchall()
            print("Polling[{}]".format(len(lines)))
            for line in lines:
                if factory.newWork(line[0], work(line)):
                    lastIndex = line[0]
                    print(line[0])
                else:
                    break
    db.close()

if __name__ == '__main__':
    dbDir = '../db'
    dbConfigFile = '{}/secret.json'.format(dbDir)
    with open(dbConfigFile) as f:
        config = fromJson(f)
    polling(config)
