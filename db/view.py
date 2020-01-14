#!/usr/bin/python3

import sqlite3 as sql
from sys import argv

bd, table = [['coreSide.db','Results'],['webSide.db','Requests']][argv[1] == 'web']
with sql.connect(bd) as conn:
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM {}'.format(table))
    lines = cursor.fetchall()
    for line in lines:
        print(line)
