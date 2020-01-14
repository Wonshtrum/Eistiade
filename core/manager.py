#!/usr/bin/python3

import sqlite3 as sql
from time import sleep, time
from threading import Thread, RLock
from works import *

lock = RLock()
class Worker(Thread):
    def __init__(self, workerId, dbFile):
        self.id = workerId
        self.dbFile = dbFile
        self.working = False
        self.requestId = None
        self.work = None
    def run(self):
        start = time()
        exitCode, arg0, arg1, arg2 = self.work.process()
        with lock:
            print('FINISH', self.id, time()-start)
            with sql.connect(self.dbFile) as conn:
                conn.isolation_level = None
                cursor = conn.cursor()
                cursor.execute('INSERT INTO Results VALUES(?, ?, ?, ?, ?)', (self.requestId, exitCode, arg0, arg1, arg2))
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
    def __init__(self, nbWorkers, dbFile):
        self.nbWorkers = nbWorkers
        self.workers = [Worker(workerId, dbFile) for workerId in range(nbWorkers)]
    def newWork(self, requestId, work):
        for worker in self.workers:
            if not worker.working:
                worker.give(requestId, work)
                return True
        return False

def polling(dbCoreFile, dbWebFile, nbWorkers):
    factory = WorkerManager(nbWorkers, dbCoreFile)
    with sql.connect(dbWebFile, uri=True) as conn:
        conn.isolation_level = None
        cursor = conn.cursor()
        cursor.execute("PRAGMA journal_mode")
        print(cursor.fetchone())
        lastIndex = 0
        while True:
            sleep(2)
            cursor.execute('SELECT * FROM Requests WHERE id > ?', (lastIndex,))
            lines = cursor.fetchall()
            print("Polling[{}]".format(len(lines)))
            for line in lines:
                if factory.newWork(line[0], work(line)):
                    lastIndex = line[0]
                    print(line[0])
                else:
                    break

if __name__ == '__main__':
    dbDir = '../db'
    dbCoreFile = '{}/coreSide.db'.format(dbDir)
    dbWebFile = '{}/webSide.db'.format(dbDir)
    polling(dbCoreFile, dbWebFile, 2)
