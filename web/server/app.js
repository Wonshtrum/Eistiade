'use strict'
/////////////////////////////////////////////
//                 INIT                    //
/////////////////////////////////////////////
const express    = require("express");
const bodyParser = require("body-parser");
const sqlite3    = require('sqlite3').verbose();
const fs         = require('fs');
const app        = express();
const __web      = __dirname.slice(0, __dirname.lastIndexOf('/'));
const __root     = __web.slice(0, __web.lastIndexOf('/'));
const __client   = __web + '/client';
const __db       = __root + '/db';
console.log(__root);


/////////////////////////////////////////////
//                   APP                   //
/////////////////////////////////////////////
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/', express.static(__client));

app.get('/', function(req, res) {
	res.sendFile(__client + '/index.html');
});
app.post('/', function(req, res) {
	res.sendFile(__client + '/index.html');
	console.log(req.body.code);
	db.run('INSERT INTO REQUEST(code, state) VALUES(?, ?)', [req.body.code, 0]);
})
app.get('/db', function(req, res) {
	db.all('SELECT * FROM REQUEST', function(err, data) {
		res.send(data);
	});
});

app.listen(8080);
console.log('Server started.');


/////////////////////////////////////////////
//                   DB                    //
/////////////////////////////////////////////
const dbFile = __db + '/link.db';
fs.unlinkSync(dbFile);
const db = new sqlite3.Database(dbFile);
//db.run('PRAGMA journal_mode=WAL')

db.serialize(function() {
	db.run('CREATE TABLE REQUEST (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, state INTEGER)');
});

//db.close();
