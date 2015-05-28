/**
 * Staging environment setup:
 * 
 */

var SOME_NICE_POUND_DEFINE = "cheetos";

var express = require('express');
/*
 * Macro for console.log
 *
 * use: log('hello', 'there', undefined, 'star');
 * output: hello there undefined star
 */
GLOBAL.log = console.log.bind(console);

module.exports = function () {
	this.use(express.errorHandler());
};