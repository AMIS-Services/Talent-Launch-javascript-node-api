var util = require('util');
var g = function (greetedPerson) {
          util.log(util.format('Hello %s!', greetedPerson));
        }


process.argv.slice(2).forEach(function (val, index, array) {
    setTimeout( function () {  g(val)}, index*1500);
});

util.log('The Main Program Flow is Done!');
