'use strict'
/////////////////////////////////////////////
//                 INIT                    //
/////////////////////////////////////////////
const express    = require("express");
const bodyParser = require("body-parser");
const sql        = require('mysql');
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
	let stmt = sql.format('INSERT INTO Requests(cmd, arg0, arg1, arg2) VALUES(?, ?, ?, ?)', [cmd, arg0, arg1, arg2]);
	listenDb(stmt, line => {console.log('end', line); res.send(line)});
})
app.get('/dbCore', function(req, res) {
	db.query('SELECT * FROM Results', function(err, data) {
		res.send(data);
	});
});
app.get('/dbWeb', function(req, res) {
	db.query('SELECT * FROM Requests', function(err, data) {
		res.send(data);
	});
});

app.listen(8080);
console.log('Server started.');


/////////////////////////////////////////////
//                   DB                    //
/////////////////////////////////////////////
const config = JSON.parse(fs.readFileSync(__db + '/secret.json'));
const db = sql.createConnection(config)

let _listenDb = function() {
	for (let [i, req] of Object.entries(listenDb.queue).reverse()) {
		db.query(req.stmt, function(err, data) {
			if (data.length == 1) {
				listenDb.queue.splice(i, 1);
				req.callback(data);
			} else {
				console.log(err, data);
			}
		});
	}
	if (listenDb.queue.length) {
		setTimeout(_listenDb, config.interval);
	} else {
		listenDb.active = false;
	}
}

let listenDb = function(inStmt, callback, outStmt) {
	console.log(inStmt);
	db.query(inStmt);
	outStmt = outStmt || 'SELECT * FROM Results WHERE id = '+(++listenDb.id);
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
db.query('SELECT MAX(id) AS id FROM Requests', function(err, data) {
	console.log(err, data);
	listenDb.id = data[0].id;
});

//db.close();
