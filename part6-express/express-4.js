// static file server for all resources in local directory public and below
// AND handle forms submission to path /forms/... 
var express = require('express'); //npm install express
var bodyParser = require('body-parser'); // npm install body-parser
var https = require("https");

var app = express()
	.use(bodyParser.urlencoded({  extended: true}))
	.get('/:name', function (request, response) { //process 
		var name = request.params['name'];

		https.get({
			host: 'api.genderize.io',
			path: '/?name[0]=' + name
		},  function (res) {

			var chunks = [];
			res.on("data", function (chunk) {
				chunks.push(chunk);
			});
			res.on("end", function () {
				var body = Buffer.concat(chunks);
				response.end(body);
			});
		});
	})
	.use(express.static(__dirname + '/public'))
	.listen(3000);

console.log('server running on port 3000');