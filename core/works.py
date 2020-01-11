from time import sleep
from core import fight
from os import system as bash, mkdir

NULL = None
playersDir = '../players'
players = {}
secret = 'amlkjfazmlncaezvapzkjb'
def genFileId(name):
    return abs(hash(name+secret)).to_bytes(8,"big").hex()

specs = {
        'python2' : ('{}.py2'  , ''                , 'python2 {}.py2'),
        'python3' : ('{}.py3'  , ''                , 'python3 {}.py3'),
        'c'       : ('_{}.c'   , 'gcc {} -o {}.c'  , './{}.c'        ),
        'c++'     : ('_{}.cpp' , 'g++ {} -o {}.cpp', './{}.cpp'      ),
        'java'    : ('{}.java' , 'javac {}'        , 'java {}.class' ),
        'scala'   : ('{}.scala', 'scalac {}'       , 'scala {}.class'),
        }
def sourceFile(fileName):
    fileId, fileType = players[fileName]
    return specs[fileType][0].format(fileId)
def compileFile(fileName):
    fileId, fileType = players[fileName]
    return specs[fileType][1].format(sourceFile(fileName), fileId)
def executeFile(fileName):
    fileId, fileType = players[fileName]
    fileDir  = '{}/{}'.format(playersDir, fileId)
    cmd = specs[fileType][2].format(fileId)
    return 'cd {} && sudo -u nobody {}'.format(fileDir, cmd)

class Work:
    def routine(self):
        raise Exception
    def process(self):
        args = self.routine()
        args.extend([NULL]*(3-len(args)))
        return args

class Send(Work):
    def __init__(self, arg0, arg1, arg2):
        self.fileName, self.fileType, self.code = arg0, arg1, arg2
    def routine(self):
        if self.fileName in players:
            return [1, 'FileName already exist']
        fileId   = genFileId(self.fileName)
        players[self.fileName] = (fileId, self.fileType)
        fileName = sourceFile(self.fileName)
        fileDir  = '{}/{}'.format(playersDir, fileId)
        filePath = '{}/{}'.format(fileDir, fileName)

        mkdir(fileDir)
        with open(filePath, 'w') as f:
            f.write(self.code)

        compileCmd = compileFile(self.fileName)
        if compileCmd:
            bash('cd {} && {}'.format(fileDir, compileCmd))
        bash('chmod -R 777 {}'.format(fileDir))

        exitCode = 0
        logs = filePath

        print('Compile', self.fileName, self.fileType)
        return [exitCode, logs]

class Set(Work):
    def __init__(self, arg0, arg1, arg2):
        self.fileName = arg0
    def routine(self):
        if self.fileName not in players:
            return [1, 'FileName doesn\'t exist']

        exitCode = 0
        logs = 'RAS'

        sleep(2)
        print('Set', self.fileName)
        return [exitCode, logs]

class Fight(Work):
    def __init__(self, arg0, arg1, arg2):
        self.ai1, self.ai2 = arg0, arg1
    def routine(self):
        if self.ai1 not in players:
            return [-1, 'AI1, {}, doesn\'t exist'.format(self.ai1)]
        if self.ai2 not in players:
            return [-1, 'AI2, {}, doesn\'t exist'.format(self.ai2)]
        print('Fight', self.ai1, self.ai2)

        game, ai1, ai2 = fight(executeFile(self.ai1), executeFile(self.ai2), players[self.ai1][0], players[self.ai2][0])

        result = game.winner
        log1 = ''.join(ai1.logHistory)
        log2 = ''.join(ai2.logHistory)
        return [result, log1, log2]

workList = [Send, Set, Fight]
def work(line):
    requestId, workId, arg0, arg1, arg2, status = line
    return workList[workId](arg0, arg1, arg2)
