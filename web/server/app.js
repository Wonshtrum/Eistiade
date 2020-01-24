'use strict'
/////////////////////////////////////////////
//                 INIT                    //
/////////////////////////////////////////////
const express    = require("express");
const bodyParser = require("body-parser");
const sql        = require('mysql');
const fs         = require('fs');
const request    = require('request');
const app        = express();
const __web      = __dirname.slice(0, __dirname.lastIndexOf('/'));
const __root     = __web.slice(0, __web.lastIndexOf('/'));
const __client   = __web + '/client';
const __db       = __root + '/db';
console.log('Root directory:', __root);


/////////////////////////////////////////////
//                   APP                   //
/////////////////////////////////////////////
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/', express.static(__client));

app.get('/', function(req, res) {
	res.sendFile(__client + '/index.html');
});
app.post('/submit', function(req, res) {
	let [cmd, arg0, arg1, arg2] = req.body['args[]'];
	let args = [arg0, arg1, arg2];
	let stmt = sql.format('INSERT INTO Requests(cmd, arg0, arg1, arg2, author) VALUES(?, ?, ?, ?, ?)', [cmd, arg0, arg1, arg2, 'Default']);
	listenDb(stmt, cmd, args, line => {res.send(line)});
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
app.get('/dbAgent', function(req, res) {
	db.query('SELECT * FROM Agents', function(err, data) {
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

const callCore = () => request.post('http://localhost:'+config.linkPort+'/event');

const _listenDb = function() {
	if (listenDb.queue.length == 0) {
		listenDb.active = false;
		return;
	}
	callCore();
	for (let [i, req] of Object.entries(listenDb.queue).reverse()) {
		console.log(req.stmt);
		db.query(req.stmt, function(err, data) {
			if (data.length == 1) {
				listenDb.queue.splice(i, 1);
				data = data[0];
				if (req.cmd == 2 && data.exitCode == 0) {
					data.field0 = JSON.parse(data.field0);
					data.field1 = JSON.parse(data.field1);
					data.field2 = JSON.parse(data.field2);
				}
				data.args = req.args;
				console.log(data);
				req.callback(data);
			} else if (++req.timeout > config.timeout) {
				listenDb.queue.splice(i, 1);
				console.log('Timeout');
				req.callback({exitCode: 2, field0: 'Sorry your request timed out for an unknown reason...'});
			} else {
				console.log(err, data);
			}
		});
	}
	setTimeout(_listenDb, config.interval);
}

const listenDb = function(inStmt, cmd, args, callback, outStmt) {
	db.query(inStmt);
	outStmt = outStmt || 'SELECT * FROM Results WHERE id = '+(++listenDb.id);
	console.log("---", listenDb.id);
	listenDb.queue.push({stmt:outStmt, cmd:cmd, args:args, callback:callback, timeout:0});
	if (!listenDb.active) {
		console.log("ACTIVATE");
		listenDb.active = true;
		_listenDb();
	} else {
		callCore();
	}
}
listenDb.active = false;
listenDb.queue = [];
db.query('SELECT MAX(id) AS id FROM Requests', function(err, data) {
	listenDb.id = data[0].id || 0;
	console.log('LastIndex:', listenDb.id);
});
