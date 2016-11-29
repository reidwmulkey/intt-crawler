var http = require('http');

var crawler = require('./modules/crawler');

http.globalAgent.maxSockets = 100;
console.log(http.globalAgent.maxSockets);

crawler.getColleges()
.then(crawler.filterColleges)
.then(crawler.writeColleges)
.then(function(data){
	console.log('got all colleges, counting: ' + data.length);
})
.catch(console.error);