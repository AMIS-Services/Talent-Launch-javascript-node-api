// Handle REST requests (POST and GET) for departments
const express = require('express') //npm install express
  , bodyParser = require('body-parser') // npm install body-parser
  , fs = require('fs')
  , https = require('https');

const departments = JSON.parse(fs.readFileSync('departments.json', 'utf8'));

const app = express()
  .use(bodyParser.urlencoded({ extended: true }))
  
  .post('/forms/department', (req, res) => { //process 
    console.log(JSON.stringify(req.body));
    departments.push({ "DEPARTMENT_ID": req.body.departmentId, "DEPARTMENT_NAME": req.body.departmentName });
    res.end('Thank you for the new department ' + req.body.departmentId + " " + req.body.departmentName);
  })

  .get('/departments/:departmentId', (req, res) => { //process 
    const department = getDepartment(req.params['departmentId']);
    console.log(JSON.stringify(department));
    res.send(department); //using send to stringify and set content-type
  })

  .get('/departmentdetails/:departmentId', (req, res) => { //process 
    const departmentId = req.params['departmentId'];
    const department = getDepartment(departmentId);

    // get employee details for department from remote API
    // https.get({
    //   host: 'https://raw.githubusercontent.com/lucasjellema/nodejs-introduction-workshop-may2017/master/part3-express/departments.json',
    //   port: 443,
    //   //path: '/departments/' + departmentId,
    //   method: 'GET'

    https.get({
      host: 'raw.githubusercontent.com',
      // port: 443,
      path: '/lucasjellema/nodejs-introduction-workshop-may2017/master/part3-express/departments.json',
      method: 'GET'
    }, resp => {
      const body = "";
      resp.on("data", chunk  => body += chunk );
      resp.on("end", () => { // when response is received, pass it on
        console.log("department details" + body);
        department.employees = JSON.parse(body);
        res.send(department); //using send to stringify and set content-type
      });
    })
    .on('error', e => console.log("Got error: " + e.message) )
  })

  .get('/departments', function (req, res) { //process 
    res.send(departments); //using send to stringify and set content-type
  })
  
  .use(express.static(__dirname + '/public'))
  .listen(3000);

console.log('server running on port 3000');

function getDepartment(departmentIdentifier) {
  const result = departments.find( department => department.DEPARTMENT_ID == departmentIdentifier );
  return result ? result : { "DEPARTMENT_ID": 0, "DEPARTMENT_NAME": "Does not exist (" + departmentIdentifier + ")" }
}