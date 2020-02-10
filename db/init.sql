DROP DATABASE IF EXISTS Eistiade;
CREATE DATABASE Eistiade;
USE Eistiade;

CREATE TABLE Requests (
	id INTEGER PRIMARY KEY,
	cmd INTEGER,
	arg0 TEXT,
	arg1 TEXT,
	arg2 TEXT,
	author TEXT,
	state INTEGER DEFAULT 0,
	date TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE Results (
	id INTEGER PRIMARY KEY,
	cmd INTEGER,
	exitCode INTEGER,
	field0 TEXT,
	field1 TEXT,
	field2 TEXT,
	date TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE Tournaments (
	id INTEGER PRIMARY KEY AUTO_INCREMENT,
	result TEXT,
	date TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE Agents (
	author TEXT,
	name TEXT,
	lang TEXT,
	status INTEGER,
	date TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE Users (
	id INTEGER PRIMARY KEY AUTO_INCREMENT,
	name TEXT,
	password TEXT,
	date TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
