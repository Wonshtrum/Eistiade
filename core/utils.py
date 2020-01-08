from multiprocessing import Process, Queue
from time import time, sleep

class ErrorWithMessage(Exception):
    def __init__(self, msg):
        self.msg = msg

def thread(maxTime, f, wait=False, otherwise=None):
    def wrapper(*args):
        if wait:
            def process(queue, *args):
                for element in f(*args):
                    queue.put(element)
        else:
            def process(queue, *args):
                queue.put(f(*args))
        queue = Queue()
        proc = Process(target = process, args=(queue, *args))
        proc.start()
        if wait:
            sleep(maxTime)
            proc.terminate()
            size = queue.qsize()
            if size:
                res = []
                for _ in range(size):
                    try:
                        #TODO prevent overflow deadlock
                        res.append(queue.get(block=False))
                    except:
                        res.append("\n-- DATA UNAVAILABLE IN TIME --\n[AT LEAST {} LINES SKIPPED]\n".format(size - _))
                        break
                return res
            else:
                return otherwise
        else:
            try:
                res = queue.get(timeout=maxTime)
                proc.join()
                return res
            except:
                proc.terminate()
                if otherwise is None:
                    raise ErrorWithMessage('Timeout!')
                else:
                    return otherwise
    return wrapper

def errorIf(predicat, error=Exception):
    if predicat:
        raise error

def errorIfNot(predicat, error=Exception):
    if not predicat:
        raise error
