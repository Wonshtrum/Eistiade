'use strict'
let express    = require("express");
let bodyParser = require("body-parser");
let app        = express();
let __client   = __dirname.slice(0, __dirname.lastIndexOf('/')) + '/client/';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/', express.static(__client));

app.get('/', function(req, res) {
	res.sendFile(__client + 'index.html');
});
app.post('/', function(req, res) {
	res.sendFile(__client + 'index.html');
	console.log(req.body.code);
})

app.listen(8080);
console.log('Server started.');
