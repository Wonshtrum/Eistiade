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
	//res.sendFile(__client + '/index.html');
	console.log(req.body.code);
	let [cmd, arg0, arg1, arg2] = req.body.code.split('\r\n\r\n');
	//db.run('INSERT INTO REQUEST(cmd, arg0, arg1, arg2, state) VALUES(?, ?, ?, ?, ?)', [cmd, arg0, arg1, arg2, 0]);
	let stmt = db.prepare('INSERT INTO REQUEST(cmd, arg0, arg1, arg2, state) VALUES(?, ?, ?, ?, ?)', [cmd, arg0, arg1, arg2, 0]);
	listenDb(stmt, line => {console.log('end', line); res.send(line)});
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
//db.isolationLevel = 0;
db.run('PRAGMA journal_mode=WAL')

db.run('CREATE TABLE REQUEST (id INTEGER PRIMARY KEY AUTOINCREMENT, cmd INTEHER, arg0 TEXT, arg1 TEXT, arg2 TEXT, state INTEGER)');

let _listenDb = function() {
	db.serialize(function() {
		for (let [i, req] of Object.entries(listenDb.queue).reverse()) {
			req.stmt.reset()
			req.stmt.get(function(err, data) {
				if (data) {
					listenDb.queue.splice(i, 1);
					req.callback(data);
				} else {
					console.log(err, data);
				}
			});
		}
	});
	if (listenDb.queue) {
		setTimeout(_listenDb, 2000);
	} else {
		listenDb.active = false;
	}
}

let listenDb = function(inStmt, callback, outStmt) {
	inStmt.run();
	outStmt = outStmt || db.prepare('SELECT * FROM REQUEST WHERE id = ? AND state = 2', ++listenDb.id);
	console.log("---", listenDb.id);
	listenDb.queue.push({stmt:outStmt, callback:callback});
	if (!listenDb.active) {
		console.log("ACTIVATE");
		listenDb.active = true;
		_listenDb();
	}
}
listenDb.id = 0;
listenDb.active = false;
listenDb.queue = [];

//db.close();
