from time import sleep
from core import fight
from ai import AI
from json import dumps as toJson

class Work:
    NULL = None
    nbArgs = 4
    sql = None
    def routine(self):
        raise Exception
    def process(self):
        args = self.routine()
        args.extend([Work.NULL]*(Work.nbArgs-len(args)))
        return args

class Send(Work):
    sql = 'INSERT INTO Agents(author, name, lang, status) VALUES(%s, %s, %s, %s)'
    def __init__(self, arg0, arg1, arg2, author):
        self.name, self.lang, self.code, self.author = arg0, arg1, arg2, author
        self.inserts = (self.author, self.name, self.lang, 0)
    def routine(self):
        if AI.exist(self.name):
            #return [1, 'AI, {}, already exist'.format(self.name)]
            ai = AI.get(self.name)
        else:
            ai = AI(self.author, self.name, self.lang)

        exitCode, logs = ai.update(self.code)
        print('Compile', self.name, self.lang)
        return [exitCode, logs]

class Set(Work):
    def __init__(self, arg0, arg1, arg2, author):
        self.name, self.code = arg0, arg1
    def routine(self):
        if not AI.exist(self.name):
            return [1, 'AI, {}, doesn\'t exist'.format(self.name)]
        ai = AI.get(self.name)

        exitCode, logs = ai.update(self.code)
        print('Set', self.name)
        return [exitCode, logs]

class Fight(Work):
    def __init__(self, arg0, arg1, arg2, author):
        self.name1, self.name2 = arg0, arg1
    def routine(self):
        if not AI.exist(self.name1):
            return [1, 'AI1, {}, doesn\'t exist'.format(self.name1)]
        if not AI.exist(self.name2):
            return [1, 'AI2, {}, doesn\'t exist'.format(self.name2)]

        ai1 = AI.get(self.name1)
        ai2 = AI.get(self.name2)
        game, ai1, ai2 = fight(ai1, ai2)

        log1 = toJson(ai1.logHistory)
        log2 = toJson(ai2.logHistory)
        gameLog = toJson(game.log)
        print("=======",game.log)
        print('Fight', self.name1, self.name2)
        return [0, log1, log2, gameLog]

workList = [Send, Set, Fight]
def work(line):
    requestId, workId, arg0, arg1, arg2, author = line
    return workList[workId](arg0, arg1, arg2, author)
