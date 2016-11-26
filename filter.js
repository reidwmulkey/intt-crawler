var fs = require('fs');
var config = require('./modules/config');

var colleges = JSON.parse(fs.readFileSync(config.collegeListFile, 'utf8'));

	var uniqueColleges = [];
	for(var i = 0; i < colleges.length; i++){
		if(uniqueColleges.indexOf(colleges[i]) === -1){
			uniqueColleges.push(colleges[i]);
		}
	}

fs.writeFile('./generated/unique-colleges.json', uniqueColleges, function(err){
	if(err)
		console.error(err);
	else
		console.log('successfully filtered colleges. #: ' + uniqueColleges.length);
});