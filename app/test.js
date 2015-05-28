/**
 * A sample test application to run unit tests
 * Invoke with 'node app/test', or create additional test apps
 */

var testDir = './test/server/';

var Mocha = require('mocha'),
	path = require('path'),
	fs = require('fs');

var mocha = new Mocha({
	reporter: 'dot',
	ui: 'bdd',
	timeout: 999999
});

fs.readdir(testDir, function (err, files) {
	if (err) {
		console.log(err);
		return;
	}
	files.forEach(function (file) {
		if (path.extname(file) === '.js') {
			console.log('including test file: %s', file);
			mocha.addFile(testDir + file);
		}
	});

	var runner = mocha.run(function () {
		console.log('finished');
	});

	runner.on('pass', function (test) {
		console.log('... %s passed', test.title);
	});

	runner.on('fail', function (test) {
		console.log('... %s failed', test.title);
	});
});