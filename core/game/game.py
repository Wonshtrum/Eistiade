from utils import ErrorWithMessage, errorIf, errorIfNot

class Game:
    def __init__(self, ai1, ai2, rows=6, columns=7, goal=4):
        self.goal = goal
        self.rows = rows
        self.columns = columns
        self.matrix = [[0]*columns for _ in range(rows)]
        self.winner = None
        self.log = {'ai1':ai1, 'ai2':ai2, 'w':columns, 'h':rows, 'moves':[], 'win':{}}
    def showBoard(self):
        return '\n'.join(' '.join(map(lambda x:'.OX'[x], line)) for line in self.matrix)
    def play(self, id, data):
        column = int(data)
        errorIfNot(0 <= column < self.columns, error=ErrorWithMessage('no such column'))
        line = 0
        while line < self.rows and not self.matrix[line][column]: line += 1
        errorIf(line == 0, error=ErrorWithMessage('column full'))
        line -= 1
        self.matrix[line][column] = id
        self.log['moves'].append(column)
    def win(self, id, state=None):
        self.winner = id
        self.log['win']['id'] = id
        if state is None:
            self.log['win']['state'] = None
        else:
            self.log['win']['state'].extend(state)
    def _check(self, i, j, k, id, align):
        if align == 0:
            self.log['win']['state'] = [i, j]
        if self.matrix[i][j] == id:
            align += 1
            if align >= self.goal:
                self.win(id, [i, j])
                return True, align
            return False, align
        else:
            return False, 0
    def checkWin(self, id):
        for i in range(self.columns):
            align = 0
            for j in range(self.rows):
                win, align = self._check(j, i, 0, id, align)
                if win: return True
        for i in range(self.rows):
            align = 0
            for j in range(self.columns):
                win, align = self._check(i, j, 1, id, align)
                if win: return True
        for i in range(self.goal-self.rows, self.columns-self.goal+1):
            align = 0
            for j in range(self.rows):
                if i+j>=0 and i+j<self.columns:
                    win, align = self._check(j, i+j, 2, id, align)
                    if win: return True
        for i in range(self.goal-1, self.columns+self.rows-self.goal):
            align = 0
            for j in range(self.rows):
                if i-j>=0 and i-j<self.columns:
                    win, align = self._check(j, i-j, 3, id, align)
                    if win: return True
        return False
