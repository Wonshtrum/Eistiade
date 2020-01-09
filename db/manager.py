import sqlite3 as sql
from time import sleep, time
from threading import Thread, RLock

lock = RLock()
class Worker(Thread):
    def __init__(self, workerId):
        self.arg = None
        self.worked = False
        self.id = workerId
    def run(self):
        self.worked = True
        for i in range(5):
            sleep(1)
            print(self.id, self.arg)
        self.finish()
    def finish(self):
        with lock:
            print("FINISH", self.id, self.arg)
            with sql.connect('link.db') as conn:
                conn.isolation_level = None
                cursor = conn.cursor()
                cursor.execute('UPDATE USER SET state = 2 WHERE id = {}'.format(self.arg))
        self.arg = None
    def work(self, arg):
        if self.arg is not None:
            return
        self.arg = arg
        Thread.__init__(self)
        self.start()

class WorkerManager:
    def __init__(self, nbWorkers):
        self.nbWorkers = nbWorkers
        self.workers = [Worker(workerId) for workerId in range(nbWorkers)]
    def newWork(self, work):
        for workerId, worker in enumerate(self.workers):
            if worker.arg is None:
                self.workers[workerId].work(work)
                return True
        return False

factory = WorkerManager(5)

with sql.connect('link.db') as conn:
    conn.isolation_level = None
    #conn.execute('PRAGMA journal_mode = WAL')
    cursor = conn.cursor()
    while True:
        sleep(2)
        print('POLLING...')
        cursor.execute('SELECT * FROM USER WHERE state = 0')
        lines = cursor.fetchall()
        print(lines)
        with lock:
            for line in lines:
                if factory.newWork(line[0]):
                    cursor.execute('UPDATE USER SET state = 1 WHERE id = {}'.format(line[0]))
                    print(line[0])
