from time import sleep
from core import fight
from ai import AI
from json import dumps as toJson

class Work:
    NULL = None
    nbArgs = 4
    sql = None
    id = None
    def routine(self):
        raise Exception
    def process(self):
        args = self.routine()
        args.extend([Work.NULL]*(Work.nbArgs-len(args)))
        return args

class Send(Work):
    def __init__(self, arg0, arg1, arg2, author):
        self.name, self.lang, self.code, self.author = arg0, arg1, arg2, author
    def routine(self):
        if self.name == '':
            return [1, 'Please name your AI before testing it.']
        if AI.exist(self.name):
            ai = AI.get(self.name)
            return [1, 'AI, {}, has already been submitted by {}.\nPlease name your AI differently.'.format(ai.name, ai.author)]
        if self.lang == '':
            return [1, 'Please choose a programming language before testing your AI.']
        if self.lang not in AI.specs:
            return [1, 'Sorry we don\'t support the following language: "{}".\nPlease contact the administrator if you think we should.'.format(self.lang)]
        if self.code == '':
            return [1, 'You know that an empty code has no effect right?']
        ai = AI(self.author, self.name, self.lang)

        exitCode, logs = ai.update(self.code)
        ai.compiled = (exitCode == 0)
        return [exitCode, logs]

class Set(Work):
    sql = 'INSERT INTO Agents(author, name, lang, status) VALUES(%s, %s, %s, %s)'
    def __init__(self, arg0, arg1, arg2, author):
        self.name = arg0
    def routine(self):
        if not AI.exist(self.name, False):
            return [1, 'AI, {}, doesn\'t exist.\nPlease test your code before submitting it.'.format(self.name)]
        ai = AI.get(self.name)
        if ai.ready:
            return [1, 'AI, {}, has already been submitted by {}.\nPlease name your AI differently.'.format(ai.name, ai.author)]
        if not ai.compiled:
            return [1, 'AI, {}, has not compiled properly.\nPlease check your code before submitting it.'.format(ai.name)]
        self.inserts = (ai.author, ai.name, ai.lang, 1)
        ai.ready = True
        return [0]

class Fight(Work):
    def __init__(self, arg0, arg1, arg2, author, official=True):
        self.name1, self.name2, self.official = arg0, arg1, official
    def routine(self):
        if not AI.exist(self.name1, self.official):
            return [1, 'AI1, {}, doesn\'t exist.'.format(self.name1)]
        if not AI.exist(self.name2, self.official):
            return [1, 'AI2, {}, doesn\'t exist.'.format(self.name2)]

        ai1 = AI.get(self.name1)
        ai2 = AI.get(self.name2)
        game, ai1, ai2 = fight(ai1, ai2)

        log1 = toJson(ai1.logHistory)
        log2 = toJson(ai2.logHistory)
        gameLog = toJson(game.log)
        return [0, log1, log2, gameLog]

workList = [Send, Set, Fight]
for i, w in enumerate(workList):
    w.id = i
def work(line):
    requestId, workId, arg0, arg1, arg2, author = line
    return workList[workId](arg0, arg1, arg2, author)
