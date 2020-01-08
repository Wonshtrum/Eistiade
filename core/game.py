from utils import ErrorWithMessage, errorIf, errorIfNot

class Game:
    def __init__(self, lines=6, columns=7, goal=4):
        self.goal = goal
        self.lines = lines
        self.columns = columns
        self.matrix = [[0]*columns for _ in range(lines)]
        self.winner = None
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
    def checkWin(self, id):
        maxAlign = 0
        for i in range(self.columns):
            align = 0
            for j in range(0, self.lines):
                if self.matrix[j][i] == id:
                    align += 1
                    if align > maxAlign:
                        maxAlign = align
                else:
                    align = 0
        for i in range(self.lines):
            align = 0
            for j in range(self.columns):
                if self.matrix[i][j] == id:
                    align += 1
                    if align > maxAlign:
                        maxAlign = align
                else:
                    align = 0
        if maxAlign >= self.goal:
            self.winner = id
        return maxAlign >= self.goal
