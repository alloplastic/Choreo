/**
 * Development environment setup:
 * 
 */

var express = require('express');

var A_POUND_DEFINE = "cheetos";

/*
* Macro for console.log
*
* use: log('hello', 'there', undefined, 'star');
* output: hello there undefined star
*/
GLOBAL.log = console.log.bind(console);

module.exports = function () {
    this.use(express.errorHandler());
    this.myvariable = "a global variable";
};