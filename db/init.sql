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
	state INTEGER DEFAULT 0);

CREATE TABLE Results (
	id INTEGER PRIMARY KEY,
	cmd INTEGER,
	exitCode INTEGER,
	field0 TEXT,
	field1 TEXT,
	field2 TEXT);

CREATE TABLE Agents (
	author TEXT,
	name TEXT,
	lang TEXT,
	status INTEGER);

CREATE TABLE Users (
	id INTEGER PRIMARY KEY AUTO_INCREMENT,
	name TEXT,
	password TEXT);
