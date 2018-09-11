// static file server for all resources in local directory public and below
// AND handle forms submission to path /forms/...
var express = require('express'); //npm install express
var bodyParser = require('body-parser'); // npm install body-parser
var https = require("https");
var util = require("util");

var app = express()
	.use(bodyParser.urlencoded({  extended: true}))
	.post('/forms/namestuff', function (request, response) { //process
        var firstname = request.body['firstname'];
        var lastname = request.body['lastname'];
		https.get({
			host: 'api.genderize.io',
			path: '/?name=' + firstname
		},  function (res) {

			var chunks = [];
			res.on("data", function (chunk) {
				chunks.push(chunk);
			});
			res.on("end", function () {
                var body = Buffer.concat(chunks);
                var genderInfo = JSON.parse(body);
                var title = genderInfo.gender === 'female' ? 'Ms.' : 'Mr';
				response.end(util.format('Thank you %s %s %s', title, firstname, lastname));
			});
		});
	})
	.use(express.static(__dirname + '/public'))
	.listen(3000);

console.log('server running on port 3000');
