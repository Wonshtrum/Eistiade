#!/usr/bin/python3

import pymysql as sql
from json import load as json
from os import system
from sys import argv

force = len(argv)>1 and argv[1] == '-f'

if force: system('sudo rm -rf ../players/*')

with open('secret.json') as f:
    config = json(f)

db = sql.connect(host=config['host'],
        user=config['user'],
        passwd=config['password'],
        db=config['database'],
        autocommit=True)
with db.cursor() as cursor:
    cursor.execute('DELETE FROM Requests')
    cursor.execute('DELETE FROM Results')
    if force:
        cursor.execute('DELETE FROM Agents')
        cursor.execute('INSERT INTO Agents VALUES(%s, %s, %s, %s)', ['$ROOT', 'Boss', 'unknown', 2])
        cursor.execute('DELETE FROM Users')
        cursor.execute('INSERT INTO Users(name) Values(%s)', ['$ROOT'])
    cursor.execute('ALTER TABLE Requests AUTO_INCREMENT = 0')
db.close()
