from ai import AI

class Tournament:
    def __init__(self, poller):
        self.poller = poller
        self.requestId = 0
        self.startId = 0
        self.running = False
        self.stopping = False
        self.competitors = None
        self.nbCompetitors = None
        self.grid = None

    def start(self):
        if self.running:
            return
        self.running = True
        self.stopping = False
        self.startId = self.requestId
        self.competitors = competitors = [ai.name for ai in AI.collection.values() if ai.ready]
        self.nbCompetitors = nb = len(competitors)
        self.grid = [[0]*nb for _ in range(nb)]
        print(competitors)
        for ai1 in competitors:
            for ai2 in competitors:
                if ai1 is not ai2:
                    self.poller.cursor.execute('INSERT INTO Requests(cmd, arg0, arg1, arg2, author, id) VALUES(%s, %s,%s, %s, %s, %s)', (2, ai1, ai2, None, '$ROOT', self.requestId))
                    print('match', self.requestId, ':', ai1, 'vs', ai2)
                    self.requestId -= 1
        print('[-- START TOURNAMENT --]')
        self.poller.signalPoll()

    def end(self):
        if self.stopping or not self.running:
            return
        self.stopping = True
        self.running = False
        print('[-- END TOURNAMENT --]')
        for l in self.grid:
            print(l)
        self.poller.signalPoll()

    def callback(self, requestId, exitCode, field0, field1, field2):
        if not self.running:
            return
        requestId = self.startId - requestId
        row = requestId // (self.nbCompetitors-1)
        col = requestId % (self.nbCompetitors-1)
        if row <= col:
            col += 1
        self.grid[row][col] = [self.competitors[col], self.competitors[row]][int(field2[-3])-1]
        if all(all(_ for j,_ in enumerate(l) if i!=j) for i,l in enumerate(self.grid)):
            self.end()
