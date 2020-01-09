import sqlite3 as sql
from time import sleep

with sql.connect('link.db') as conn:
    conn.isolation_level = None
    #conn.execute('PRAGMA journal_mode = WAL')
    cursor = conn.cursor()
    lastId = 0
    while True:
        sleep(2)
        print('POLLING...')
        cursor.execute('SELECT * FROM USER WHERE state = 0')
        lines = cursor.fetchall()
        print(lines)
        for line in lines:
            print(line[0])
            cursor.execute('UPDATE USER SET state = 1 WHERE id = {}'.format(line[0]))
