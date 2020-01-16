from utils import ErrorWithMessage, errorIf, errorIfNot

class Game:
    def __init__(self, lines=6, columns=7, goal=4):
        self.goal = goal
        self.lines = lines
        self.columns = columns
        self.matrix = [[0]*columns for _ in range(lines)]
        self.winner = None
        self.log = {'moves':[], 'win':{}}
    def showBoard(self):
        return '\n'.join(' '.join(map(lambda x:'.OX'[x], line)) for line in self.matrix)
    def play(self, id, data):
        column = int(data)
        errorIfNot(0 <= column < self.columns, error=ErrorWithMessage('no such column'))
        line = 0
        while line < self.lines and not self.matrix[line][column]: line += 1
        errorIf(line == 0, error=ErrorWithMessage('column full'))
        line -= 1
        self.matrix[line][column] = id
        self.log['moves'].append(column)
    def win(self, id, state=None):
        self.winner = id
        self.log['win']['id'] = id
        self.log['win']['state'] = state
    def _check(self, i, j, k, id, align):
        print(k,">",i,j,"=",align)
        if self.matrix[i][j] == id:
            align += 1
            if align >= self.goal:
                self.win(id, [i, j, k])
                return True, align
            return False, align
        else:
            return False, 0
    def checkWin(self, id):
        for i in range(self.columns):
            align = 0
            for j in range(self.lines):
                win, align = self._check(j, i, 0, id, align)
                if win: return True
        for i in range(self.lines):
            align = 0
            for j in range(self.columns):
                win, align = self._check(i, j, 1, id, align)
                if win: return True
        for i in range(self.goal-self.lines, self.columns-self.goal+1):
            align = 0
            for j in range(self.lines):
                if i+j>=0 and i+j<self.columns:
                    win, align = self._check(j, i+j, 2, id, align)
                    if win: return True
        for i in range(self.goal-1, self.columns+self.lines-self.goal):
            align = 0
            for j in range(self.lines):
                if i-j>=0 and i-j<self.columns:
                    win, align = self._check(j, i-j, 3, id, align)
                    if win: return True
        return False
