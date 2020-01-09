import sqlite3 as sql

with sql.connect('link.db') as conn:
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM USER')
    lines = cursor.fetchall()
    for line in lines:
        print(line)
