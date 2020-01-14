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
	let stmt = dbWeb.prepare('INSERT INTO Requests(cmd, arg0, arg1, arg2) VALUES(?, ?, ?, ?)', [cmd, arg0, arg1, arg2]);
	listenDb(stmt, line => {console.log('end', line); res.send(line)});
})
app.get('/dbCore', function(req, res) {
	dbCore.all('SELECT * FROM Results', function(err, data) {
		console.log(err, data);
		res.send(data);
	});
});
app.get('/dbWeb', function(req, res) {
	dbWeb.all('SELECT * FROM Requests', function(err, data) {
		console.log(err, data);
		res.send(data);
	});
});

app.listen(8080);
console.log('Server started.');


/////////////////////////////////////////////
//                   DB                    //
/////////////////////////////////////////////
const dbCoreFile = __db + '/coreSide.db';
const dbWebFile = __db + '/webSide.db';
const dbCore = new sqlite3.Database(dbCoreFile, sqlite3.OPEN_READONLY);
const dbWeb = new sqlite3.Database(dbWebFile, sqlite3.OPEN_READWRITE);

let _listenDb = function() {
	dbCore.serialize(function() {
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
	if (listenDb.queue.length) {
		setTimeout(_listenDb, 2000);
	} else {
		listenDb.active = false;
	}
}

let listenDb = function(inStmt, callback, outStmt) {
	inStmt.run();
	outStmt = outStmt || dbCore.prepare('SELECT * FROM Results WHERE id = ?', ++listenDb.id);
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
