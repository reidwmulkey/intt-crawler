var crawler = require('./modules/crawler');

crawler.getColleges()
.then(function(data){
	console.log('got all colleges, counting: ' + data.length);
})
.catch(console.error);