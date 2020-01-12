from subprocess import Popen, PIPE
from utils import ErrorWithMessage, errorHandling

def bash(cmd, block=True):
    process = Popen(cmd, shell=True, stdout=PIPE, stderr=PIPE)
    stdout, stderr = process.communicate()
    if block and stderr:
        raise ErrorWithMessage(stderr.decode())
    return (stdout.decode(), stderr.decode())

class AI:
    rootDir = '../players'
    collection = {}
    specs = {
        'python2' : ('{}.py2'  , ''                , 'python2 {}.py2'),
        'python3' : ('{}.py3'  , ''                , 'python3 {}.py3'),
        'c'       : ('_{}.c'   , 'gcc {} -o {}.c'  , './{}.c'        ),
        'c++'     : ('_{}.cpp' , 'g++ {} -o {}.cpp', './{}.cpp'      ),
        'java'    : ('{}.java' , 'javac {}'        , 'java {}.class' ),
        'scala'   : ('{}.scala', 'scalac {}'       , 'scala {}.class'),
        }

    def __init__(self, author, name, lang):
        self.author = author
        self.name = name
        self.lang = lang

        self.fileDir = '{}/{}/{}'.format(AI.rootDir, author, name)
        self.fileName = AI.specs[lang][0].format(name)
        self.filePath = '{}/{}'.format(self.fileDir, self.fileName)
        
        AI.collection[name] = self

    def exist(name):
        return name in AI.collection

    def get(name):
        return AI.collection[name]

    @errorHandling
    def write(self, code):
        bash('mkdir -p {}'.format(self.fileDir))
        with open(self.filePath, 'w') as f:
            f.write(code)

    @errorHandling
    def compile(self):
        compileCmd = AI.specs[self.lang][1].format(self.fileName, self.name)
        if compileCmd:
            bash('cd {} && {}'.format(self.fileDir, compileCmd))
        bash('chmod -R 777 {}'.format(self.fileDir))

    def execute(self):
        executeCmd = AI.specs[self.lang][2].format(self.name)
        return 'cd {} && sudo -u nobody {}'.format(self.fileDir, executeCmd)
