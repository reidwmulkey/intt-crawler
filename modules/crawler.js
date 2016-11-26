var fs = require('fs');
var q = require('q');
var http = require('http');
var _ = require('underscore');
var cheerio = require('cheerio');
var crawler = require('js-crawler');

var config = require('./config');

module.exports.getColleges = function(){
	var deferred = q.defer();
	var promises = [];

	_.each(config.stateList, function(state){
		promises.push(module.exports.getOuterUrls(state));
	});

	q.all(promises)
	.then(function(outerUrls){
		var promises = [];

		_.each(_.flatten(outerUrls), function(outerUrl){
			promises.push(module.exports.getInnerUrls(outerUrl));
		})
		q.all(promises)
		.then(function(innerUrls){
			deferred.resolve(innerUrls);
		});
	})
	.catch(deferred.reject);

	return deferred.promise;
}

module.exports.getOuterUrls = function(stateUrl){
	var deferred = q.defer();
	get(stateUrl)
	.then(function(body){
		var $ = cheerio.load(body);
		var list = $('tbody a');
		var pages = [];
		list.each(function(index, item){
			var $item = $(item);
			pages.push(config.baseURL + $item.attr('href'));
		});
		deferred.resolve(pages);
	})
	.catch(deferred.reject);

	return deferred.promise;
}

module.exports.getInnerUrls = function(outerUrl){
	var deferred = q.defer();
	get(outerUrl)
	.then(function(body){
		var $ = cheerio.load(body);
		var innerUrl = $('.post-meta a').attr('href');
		if(!innerUrl || innerUrl === "http://"){
			deferred.resolve(innerUrl);
		}
		else{
			fs.appendFile(config.collegeListFile, "\"" + innerUrl + "\", ", function (err) {
				console.log('wrote to file: ' + innerUrl);
				if(err)
					deferred.reject(err);
				else
					deferred.resolve(innerUrl);
			});
		}
	})
	.catch(deferred.reject);

	return deferred.promise;
}

module.exports.crawlColleges = function(){
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
	.on('error', deferred.reject);
	return deferred.promise;
}