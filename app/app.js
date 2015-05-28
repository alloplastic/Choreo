#!/usr/bin/env node

var program = require('commander');
var locomotive = require('locomotive');

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

program.version("0.0.2");

program
  .description('-> start Locomotive server')
  .option('-a, --address [address]', 'listen on specified address (default: 0.0.0.0)')
  .option('-p, --port [port]', 'listen on specified port (default: 3000)', parseInt)
  .option('-e, --env [environment]', 'run in specified environment (default: development)')
  .option('-c, --cluster', 'run in clustered mode, utilizing all CPUs')
  .option('-D, --dir [directory]', 'run app from a specific directory (default: `pwd`)')
  .option('-w, --watch', 'watch for code changes and reload')
  .option('--use-nodemon', 'use nodemon for automatic reloading (default: supervisor)')
  .option('--debug [port]', 'enable V8 debugger on specified port (default: 5858)', parseInt)
  .option('--debug-brk [port]', 'enable V8 debugger on specified port and break immediately (default: 5858)', parseInt)

program.parse(process.argv);

//Load the program options
options = {};
options.address = program.address || '0.0.0.0';
options.port = program.port || process.env.PORT || 3000;
options.env = program.env || process.env.NODE_ENV || 'development';
options.cluster = program.cluster;
options.watch = program.watch;
options.app = program.app;

if (options.cluster && cluster.isMaster) {
	
  var numWorkers = numCPUs-2;
  if (numWorkers<1) numWorkers = 1;
  
  // Fork workers.
  for (var i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
  
  cluster.on('death', function(worker) {
    console.log('worker ' + worker.pid + ' died.  Forking a new worker...');
	cluster.fork();
  });
  
} else {
  // Worker processes run locomotive
  locomotive.cli.server(options.app || process.cwd(), options.address, options.port, options.env, options);  
}
