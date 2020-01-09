import sqlite3 as sql
from time import sleep, time
from threading import Thread, RLock

lock = RLock()
class Worker(Thread):
    def __init__(self, workerId):
        self.arg = None
        self.id = workerId
    def run(self):
        start = time()
        self.process()
        with lock:
            print("FINISH", self.id, self.arg, time()-start)
            with sql.connect('link.db') as conn:
                conn.isolation_level = None
                self.terminate(conn.cursor())
        self.arg = None
    def process(self):
        raise Exception
    def terminate(self, cursor):
        raise Exception
    def work(self, arg):
        if self.arg is not None:
            return
        self.arg = arg
        Thread.__init__(self)
        self.start()

def newProcess(self):
    sleep(5)
def newTerminate(self, cursor):
    cursor.execute('UPDATE REQUEST SET state = 2 WHERE id = {}'.format(self.arg))
Worker.process = newProcess
Worker.terminate = newTerminate

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

factory = WorkerManager(1)

with sql.connect('link.db') as conn:
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
                if factory.newWork(line[0]):
                    cursor.execute('UPDATE REQUEST SET state = 1 WHERE id = {}'.format(line[0]))
                    print(line[0])
