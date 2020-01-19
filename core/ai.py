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
        self.ready = False
        self.compiled = False

        self.fileName = AI.specs[lang][0].format(name)
        self.tmpDir = '{}/{}/tmp'.format(AI.rootDir, author)
        self.tmpPath = '{}/{}'.format(self.tmpDir, self.fileName)
        self.fileDir = '{}/{}/{}'.format(AI.rootDir, author, name)
        self.filePath = '{}/{}'.format(self.fileDir, self.fileName)
    
    def register(self, create=True):
        if create:
            bash('mkdir -p {}'.format(self.fileDir))
            bash('mv {}/* {}'.format(self.tmpDir, self.fileDir))
        else:
            AI.collection[self.name] = self
            self.ready = True
            self.compiled = True

    def exist(name, official=True):
        return name in AI.collection and (AI.collection[name].ready or not official)

    def get(name):
        return AI.collection[name]

    def write(self, code):
        bash('rm -rf {}/*'.format(self.tmpDir))
        bash('mkdir -p {}'.format(self.tmpDir))
        with open(self.tmpPath, 'w') as f:
            f.write(code)

    def compile(self):
        compileCmd = AI.specs[self.lang][1].format(self.fileName, self.name)
        if compileCmd:
            bash('cd {} && {}'.format(self.tmpDir, compileCmd))
        bash('chmod 777 {}/*'.format(self.tmpDir))

    def execute(self):
        executeCmd = AI.specs[self.lang][2].format(self.name)
        return 'cd {} && sudo -u nobody {}'.format(self.fileDir, executeCmd)

    @errorHandling
    def update(self, code):
        AI.collection[self.name] = self
        self.write(code)
        self.compile()
        self.register()
