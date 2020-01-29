'use strict'
/////////////////////////////////////////////
//                 INIT                    //
/////////////////////////////////////////////
const express    = require("express");
const session    = require("express-session");
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
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/', express.static(__client));

const legalChar = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const illegalStr = (name, str, res, min, max) => {
	min = min || 4;
	max = max || 20;
	let error = null;
	if (!Object.values(str).reduce((x,y) => x && legalChar.includes(y), true)) {
		error = 'contains illegal characters';
	} else if (str.length < min) {
		error =  'is too short';
	} else if (str.length > max) {
		error = 'is too long';
	}
	if (error === null) {
		return false;
	} else {
		res.send({exitCode: 2, field0: name+' '+error});
		return true;
	}
}
const notLogged = (req, res) => {
	if (req.session.loggedIn) {
		return false;
	} else {
		res.send({exitCode: 2, field0: 'You must be logged in to do this!'});
		return true;
	}
}

app.get('/', function(req, res) {
	res.sendFile(__client + '/index.html');
});
app.post('/submit', function(req, res) {
	let [cmd, arg0, arg1, arg2] = req.body['args[]'];
	if (cmd == 3) {
		if (illegalStr('Name', arg0, res) || illegalStr('Password', arg1, res, 8, 20)) return;
		let stmt = sql.format('SELECT * FROM Users WHERE name = ?', [ arg0 ]);
		db.query(stmt, function(err, data) {
			if (!err && data && data.length === 0) {
				stmt = sql.format('INSERT INTO Users(name, password) VALUES(?, ?)', [ arg0, arg1 ]);
				db.query(stmt);
				req.session.loggedIn = true;
				req.session.username = arg0;
				res.send({exitCode: 0});
			} else {
				res.send({exitCode: 1, field0: 'Name is already taken'});
			}
		});
		return;
	} else if (cmd == 4) {
		let stmt = sql.format('SELECT * FROM Users WHERE name = ? AND password = ?', [ arg0, arg1 ]);
		db.query(stmt, function(err, data) {
			if (!err && data && data.length > 0) {
				req.session.loggedIn = true;
				req.session.username = arg0;
				res.send({exitCode: 0});
			} else {
				res.send({exitCode: 1, field0: 'Wrong name or password'});
			}
		});
		return;
	} else if (cmd == 5) {
		req.session.loggedIn = false;
		res.send({exitCode: 0});
		return;
	} else if (cmd == 6) {
		db.query('SELECT * FROM Agents', function(err, data) {
			if (!err) {
				res.send({exitCode: 0, data: data});
			} else {
				res.send({exitCode: 1});
			}
		});
		return;
	}
	if ((cmd < 2 && notLogged(req, res)) || illegalStr('Name', arg0, res)) return;
	let args = [ arg0, arg1, arg2 ];
	let stmt = sql.format('INSERT INTO Requests(cmd, arg0, arg1, arg2, author) VALUES(?, ?, ?, ?, ?)', [cmd, arg0, arg1, arg2, req.session.username]);
	listenDb(stmt, cmd, args, data => {res.send(data)});
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
app.get('/dbUser', function(req, res) {
	db.query('SELECT * FROM Users', function(err, data) {
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

app.post('/result', function(req, res) {
	res.send();
	let id = req.body.id;
	console.log('RESPONSE FOR', req.body.id);
	req = listenDb.queue[id];
	if (!req) return;
	db.query(req.stmt, function(err, data) {
		if (data.length == 1) {
			data = data[0];
			if (req.cmd == 2 && data.exitCode == 0) {
				data.field0 = JSON.parse(data.field0);
				data.field1 = JSON.parse(data.field1);
				data.field2 = JSON.parse(data.field2);
			}
			data.args = req.args;
			req.callback(data);
		} else {
			console.log(err, data);
			req.callback({exitCode: 2, field0: 'Sorry something wen\'t wrong on the server side...'});
		}
		delete listenDb.queue[id];
	});
});

const listenDb = function(inStmt, cmd, args, callback, outStmt) {
	db.query(inStmt);
	let id = ++listenDb.id;
	outStmt = outStmt || 'SELECT * FROM Results WHERE id = '+(id);
	listenDb.queue[id] = {id:id, stmt:outStmt, cmd:cmd, args:args, callback:callback, timeout:0};
	callCore();
}
listenDb.queue = {};
db.query('SELECT MAX(id) AS id FROM Requests', function(err, data) {
	listenDb.id = data[0].id || 0;
	console.log('LastIndex:', listenDb.id);
});
