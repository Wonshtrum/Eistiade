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
            if queue.qsize():
                return [queue.get() for _ in range(queue.qsize())]
            else:
                return otherwise
        else:
            try:
                res = queue.get(timeout=maxTime)
                proc.join()
                return res
            except:
                proc.terminate()
                if not otherwise:
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
