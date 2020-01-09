'use strict'
/////////////////////////////////////////////
//                 INIT                    //
/////////////////////////////////////////////
let express    = require("express");
let bodyParser = require("body-parser");
let sqlite3    = require('sqlite3').verbose();
let fs         = require('fs');
let app        = express();
let __web      = __dirname.slice(0, __dirname.lastIndexOf('/'));
let __root     = __web.slice(0, __web.lastIndexOf('/'));
let __client   = __web + '/client';
let __db       = __root + '/db';
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
	db.run('INSERT INTO USER(code, state) VALUES(?, ?)', [req.body.code, 0]);
})

app.listen(8080);
console.log('Server started.');


/////////////////////////////////////////////
//                   DB                    //
/////////////////////////////////////////////
let dbFile = __db + '/link.db';
fs.unlinkSync(dbFile);
let db = new sqlite3.Database(dbFile);
//db.run('PRAGMA journal_mode=WAL')

db.serialize(function() {
	db.run('CREATE TABLE USER (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, state INTEGER)');
	/*let stmt = db.prepare('INSERT INTO lorem VALUES (?)');
	for (let i = 0; i < 10; i++) {
	stmt.run('Ipsum ' + i);
	}
	stmt.finalize();

	db.each('SELECT rowid AS id, info FROM lorem', function(err, row) {
	console.log(row.id + ': ' + row.info);
	});*/
});

//db.close();
