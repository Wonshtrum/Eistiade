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
        arg0, arg1, arg2 = self.work.process()
        with lock:
            print('FINISH', self.id, time()-start)
            with sql.connect(self.dbFile) as conn:
                conn.isolation_level = None
                cursor = conn.cursor()
                cursor.execute('UPDATE REQUEST SET state = 2, arg0 = ?, arg1 = ?, arg2 = ? WHERE id = ?', (str(arg0), arg1, arg2, self.requestId))
                #cursor.execute('UPDATE REQUEST SET state = 2 WHERE id = {}'.format(self.requestId))
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

def polling(dbFile, nbWorkers):
    factory = WorkerManager(nbWorkers, dbFile)
    with sql.connect(dbFile) as conn:
        conn.isolation_level = None
        #conn.execute('PRAGMA journal_mode = WAL')
        cursor = conn.cursor()
        cursor.execute('UPDATE REQUEST SET state = 0')
        while True:
            sleep(2)
            cursor.execute('SELECT * FROM REQUEST WHERE state = 0')
            lines = cursor.fetchall()
            print("Polling[{}]".format(len(lines)))
            with lock:
                for line in lines:
                    if factory.newWork(line[0], work(line)):
                        cursor.execute('UPDATE REQUEST SET state = 1 WHERE id = {}'.format(line[0]))
                        print(line[0])

if __name__ == '__main__':
    polling('../db/link.db', 2)
