#!/usr/bin/python3

import sqlite3 as sql
from os import system

system('rm -f *.db*')

with sql.connect('webSide.db') as conn:
    conn.execute('pragma journal_mode=wal')
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE Requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cmd INTEGER,
            arg0 TEXT,
            arg1 TEXT,
            arg2 TEXT)""")

with sql.connect('coreSide.db') as conn:
    conn.execute('pragma journal_mode=wal')
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE Results (
            id INTEGER PRIMARY KEY,
            exitCode INTEGER,
            field0 TEXT,
            filed1 TEXT,
            field2 TEXT)""")
