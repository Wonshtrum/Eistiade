import sqlite3 as sql

with sql.connect('link.db') as conn:
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM REQUEST')
    lines = cursor.fetchall()
    for line in lines:
        print(line)
