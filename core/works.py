from time import sleep
from core import *
from os import system as bash, mkdir

NULL = ''
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
def language(lang):
    specsLang = specs[lang]
    class res:
        def source(fileId):
            return specsLang[0].format(fileId)
        def compile(fileId):
            return specsLang[1].format(res.source(fileId), fileId)
        def execute(fileId):
            return specsLang[2].format(fileId)
    return res
    

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
        fileName = language(self.fileType).source(fileId)
        fileDir  = '{}/{}'.format(playersDir, fileId)
        filePath = '{}/{}'.format(fileDir, fileName)
        players[self.fileName] = (fileId, self.fileType)

        mkdir(fileDir)
        bash('touch {}'.format(filePath))
        with open(filePath, 'w') as f:
            f.write(self.code)

        compileCmd = language(self.fileType).compile(fileId)
        if compileCmd:
            bash('cd {} && {}'.format(fileDir, compileCmd))

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
        sleep(7)
        print('Fight', self.ai1, self.ai2)
        result = 1
        log1 = 'LOG1'
        log2 = 'LOG2'
        return [result, log1, log2]

workList = [Send, Set, Fight]
def work(line):
    requestId, workId, arg0, arg1, arg2, status = line
    return workList[workId](arg0, arg1, arg2)
