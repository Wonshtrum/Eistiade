#!/usr/bin/python3

import sqlite3 as sql
from time import sleep, time
from threading import Thread, RLock
from sys import path
from core import *

lock = RLock()
class Worker(Thread):
    def __init__(self, workerId, dbFile):
        self.working = False
        self.requestId = None
        self.args = None
        self.id = workerId
        self.dbFile = dbFile
    def run(self):
        start = time()
        self.process()
        with lock:
            print("FINISH", self.id, self.args, time()-start)
            with sql.connect(self.dbFile) as conn:
                conn.isolation_level = None
                self.terminate(conn.cursor())
        self.working = False
    def process(self):
        raise Exception
    def terminate(self, cursor):
        raise Exception
    def work(self, requestId, args):
        if self.working:
            raise Exception
        self.requestId = requestId
        self.args = args
        Thread.__init__(self)
        self.start()

def newProcess(self):
    sleep(5)
def newTerminate(self, cursor):
    cursor.execute('UPDATE REQUEST SET state = 2 WHERE id = {}'.format(self.requestId))
Worker.process = newProcess
Worker.terminate = newTerminate

class WorkerManager:
    def __init__(self, nbWorkers, dbFile):
        self.nbWorkers = nbWorkers
        self.workers = [Worker(workerId, dbFile) for workerId in range(nbWorkers)]
    def newWork(self, requestId, work):
        for workerId, worker in enumerate(self.workers):
            if worker.args is None:
                self.workers[workerId].work(requestId, work)
                return True
        return False

def polling(dbFile, nbWorkers):
    factory = WorkerManager(nbWorkers, dbFile)
    with sql.connect(dbFile) as conn:
        conn.isolation_level = None
        #conn.execute('PRAGMA journal_mode = WAL')
        cursor = conn.cursor()
        while True:
            sleep(2)
            cursor.execute('SELECT * FROM REQUEST WHERE state = 0')
            lines = cursor.fetchall()
            print("Polling[{}]".format(len(lines)))
            with lock:
                for line in lines:
                    if factory.newWork(line[0], line[1:]):
                        cursor.execute('UPDATE REQUEST SET state = 1 WHERE id = {}'.format(line[0]))
                        print(line[0])

if __name__ == '__main__':
    polling('../db/link.db', 5)
