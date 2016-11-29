var fs = require('fs');
var q = require('q');
var http = require('http');
var _ = require('underscore');
var cheerio = require('cheerio');
var crawler = require('js-crawler');

var config = require('./config');

module.exports.writeColleges = function(filteredColleges){
	console.log('writing colleges.');
	var deferred = q.defer();
	fs.appendFile(config.collegeListFile, JSON.stringify(filteredColleges), function (err) {
		console.log('wrote to file.');
		if(err)
			deferred.reject(err);
		else
			deferred.resolve(filteredColleges);
	});
	return deferred.promise;
}

module.exports.filterColleges = function(collegeList){
	console.log('filtering colleges');
	var deferred = q.defer();
	var filteredColleges = [];
	_.each(collegeList, function(college){
		if(college.innerUrl && college.innerUrl !== 'http://'){
			filteredColleges.push(college);
		}
	});
	console.log('filtered colleges.');
	deferred.resolve(filteredColleges);
	return deferred.promise;
}

module.exports.getColleges = function(){
	var deferred = q.defer();
	var promises = [];

	_.each(config.stateListWithCodes, function(state){
		promises.push(module.exports.getOuterCollegeObject(state));
	});

	q.all(promises)
	.then(function(outerCollegeObjects){
		var promises = [];
		_.each(outerCollegeObjects, function(outerCollegeObject){
			_.each(outerCollegeObject.outerUrls, function(outerUrl){
				var collegeObject = {
					postalCode: outerCollegeObject.postalCode,
					name: outerCollegeObject.name,
					url: outerCollegeObject.url,
					outerUrl: outerUrl
				};
				promises.push(module.exports.getInnerCollegeObject(collegeObject));
			});
		});
		q.all(promises)
		.then(function(innerCollegeObjects){
			console.log('retrieved all college urls');
			deferred.resolve(innerCollegeObjects);
		});
	})
	.catch(deferred.reject);

	return deferred.promise;
}

module.exports.getOuterCollegeObject = function(state){
	var deferred = q.defer();
	console.log('getting colleges for ' + state.name);
	get(state.url)
	.then(function(body){
		console.log('got ' + state.name);
		var $ = cheerio.load(body);
		var list = $('tbody a');
		var pages = [];
		list.each(function(index, item){
			var $item = $(item);
			pages.push(config.baseURL + $item.attr('href'));
		});
		state.outerUrls = pages;
		deferred.resolve(state);
	})
	.catch(deferred.reject);

	return deferred.promise;
}

module.exports.getInnerCollegeObject = function(outerCollegeObject){
	var deferred = q.defer();
	console.log('getting outerUrl ' + outerCollegeObject.outerUrl);
	get(outerCollegeObject.outerUrl)
	.then(function(body){
		var $ = cheerio.load(body);
		var innerUrl = $('.post-meta a').attr('href');
		var innerCollegeObject = {
			postalCode: outerCollegeObject.postalCode,
			name: outerCollegeObject.name,
			url: outerCollegeObject.url,
			outerUrl: outerCollegeObject.outerUrl,
			innerUrl: innerUrl
		};
		console.log('retrieved inner url ' + innerUrl);
		deferred.resolve(innerCollegeObject);
	})
	.catch(deferred.reject);

	return deferred.promise;
}

module.exports.crawlColleges = function(){
	var collegeList = JSON.parse(fs.readFileSync(config.collegeListFile, 'utf8'));
	console.log(collegeList);
	new Crawler().configure({depth: 1})
	.crawl("http://www.google.com", function onSuccess(page) {
	console.log(page.url);
	});
}

function get(url){
	var deferred = q.defer();
	http.get(url, function(res){
		var body = '';
		res.on('data', function(chunk) {
			body += chunk;
		});
		res.on('end', function() {
			deferred.resolve(body);
		});
	})
	.on('error', deferred.reject)
	.setTimeout(1000000, deferred.reject);
	return deferred.promise;
}