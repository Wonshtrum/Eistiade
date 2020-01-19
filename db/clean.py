#!/usr/bin/python3

import pymysql as sql
from json import load as json
from os import system

system('sudo rm -rf ../players/*')

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
    cursor.execute('DELETE FROM Agents')
    cursor.execute('ALTER TABLE Requests AUTO_INCREMENT = 0')
db.close()
