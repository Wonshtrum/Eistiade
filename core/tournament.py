from ai import AI
from json import dumps as toJson

class Tournament:
    def __init__(self, poller, nbMatch=3):
        self.poller = poller
        self.requestId = 0
        self.startId = 0
        self.running = False
        self.stopping = False
        self.competitors = None
        self.nbCompetitors = None
        self.grid = None
        self.remaining = 0
        self.nbMatch = nbMatch

    def start(self):
        if self.running:
            return
        self.running = True
        self.stopping = False
        self.startId = self.requestId
        self.poller.cursor.execute('SELECT name, author FROM Agents WHERE status > 0')
        self.competitors = competitors = [ai[0] for ai in self.poller.cursor.fetchall()]
        self.nbCompetitors = nb = len(competitors)
        self.grid = [[[] for i in range(nb)] for j in range(nb)]
        print(competitors)
        self.remaining = 0
        for ai1 in competitors:
            for ai2 in competitors:
                if ai1 is not ai2:
                    for _ in range(self.nbMatch):
                        self.poller.cursor.execute('INSERT INTO Requests(cmd, arg0, arg1, arg2, author, id) VALUES(%s, %s,%s, %s, %s, %s)', (2, ai1, ai2, None, '$ROOT', self.requestId))
                        print('match', self.requestId, ':', ai1, 'vs', ai2)
                        self.requestId -= 1
                        self.remaining += 1
        print('[-- START TOURNAMENT --]')
        self.poller.signalPoll()

    def end(self):
        if self.stopping or not self.running:
            return
        self.stopping = True
        print('[-- END TOURNAMENT --]')
        for l in self.grid:
            print(l)
        res = {ai:0 for ai in self.competitors}
        for row, line in enumerate(self.grid):
            for col, match in enumerate(line):
                ai1 = self.competitors[row]
                ai2 = self.competitors[col]
                for _ in match:
                    if ai1 != ai2:
                        winner = ai1 if _ == 0 else ai2
                        print(ai1, 'vs', ai2, ':', winner)
                        res[winner] += 1
        print(res)
        self.poller.cursor.execute('INSERT INTO Tournaments(result) VALUES(%s)', (toJson(res),))
        self.poller.signalPoll()
        self.running = False

    def callback(self, requestId, exitCode, field0, field1, field2):
        if not self.running:
            return
        self.remaining -= 1
        requestId = (self.startId - requestId)//self.nbMatch
        row = requestId // (self.nbCompetitors-1)
        col = requestId % (self.nbCompetitors-1)
        if row <= col:
            col += 1
        _, _, data = field2.partition('"id": ')
        self.grid[row][col].append(int(data[0])-1)
        if self.remaining == 0:
            self.end()
