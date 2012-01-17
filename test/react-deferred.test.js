'use strict';

var test = require('tap').test;

var react = require('react');
require('../'); // require('react-deferred');
var EventCollector = require('react/lib/track-tasks').EventCollector;

function multiply(x, y, cb) { cb(null, x * y); }
function add(x, y, cb) { cb(null, x + y); }

test('calling without cb, switches to promise style', function (t) {
  t.plan(2);
  var fn = react();
  var errors = fn.setAndValidateAST({
    inParams: ['a', 'b'],
    tasks: [    
      { f: multiply, a: ['a', 'b'], out: ['c'] }
    ],
    outTask: { a: ['c'] }
  });
  t.deepEqual(errors, [], 'no validation errors');

  var promise = fn(2, 3);
  promise.then(function (c) {
    t.equal(c, 6);
    t.end();
  });
});  

test('selectFirst, switch to promise style', function (t) {
  function noSuccess(a, b, cb) { cb(null); } // returns undefined result
  function noSuccessNull(a, b, cb) { cb(null, null); } // returns null result
  
  t.plan(6);
  var fn = react();
  var errors = fn.setAndValidateAST({
    inParams: ['a', 'b'],
    tasks: [    
      { f: noSuccess, a: ['a', 'b'], out: ['c'] },
      { f: noSuccessNull, a: ['a', 'b'], out: ['c'], after: ['noSuccess'] },
      { f: add, a: ['a', 'b'], out: ['c'], after: ['noSuccessNull'] }
    ],
    outTask: { type: 'finalcbFirst', a: ['c'] }
  });
  t.deepEqual(errors, [], 'no validation errors');

  var collector = new EventCollector();
  collector.capture(fn, 'task.complete');

  fn(2, 3, function (err, c, d) {
    t.equal(err, null);
    t.equal(c, 5);
    var events = collector.list();
    t.equal(events.length, 3, 'should have seen three task compl events');
    t.equal(events[2].task.name, 'add', 'name matches');
    t.deepEqual(events[2].task.results, [5], 'results match');
    t.end();
  });
});  


// Additional tests to convert

/* using promises instead of callbacks */

// test('multi-step promise single ret value', function (t) {
//   t.plan(2);
//   var fn = react();
//   var errors = fn.setAndValidateAST({
//     inParams: ['a', 'b'],
//     tasks: [    
//       { f: multiply, a: ['a', 'b'], cb: ['c'] },
//       { f: add, a: ['c', 'b'], cb: ['d'] }
//     ],
//     outTask: { a: ['d'] }
//   });
//   t.deepEqual(errors, [], 'no validation errors');

//   var promise = fn(2, 3, Promise);
//   promise.then(function (d) {
//     t.equal(d, 9);
//     t.end();
//   });
// });  

// test('multi-step promise w promise args single ret value', function (t) {
//   t.plan(2);
//   var fn = react();
//   var errors = fn.setAndValidateAST({
//     inParams: ['a', 'b'],
//     tasks: [    
//       { f: multiply, a: ['a', 'b'], cb: ['c'] },
//       { f: add, a: ['c', 'b'], cb: ['d'] }
//     ],
//     outTask: { a: ['d'] }
//   });
//   t.deepEqual(errors, [], 'no validation errors');

//   function promised(x) {
//     var deferred = react.options.promiseModule.defer();
//     setTimeout(function () { deferred.resolve(x); }, 100);
//     return deferred.promise;
//   }

//   var p2 = promised(2);
//   var p3 = promised(3);

//   var promise = fn(p2, p3, react.options.promiseModule);
//   promise.then(function (d) {
//     t.equal(d, 9);
//     t.end();
//   });
// });  


// test('multi-step promise w promise args, first errors', function (t) {
//   t.plan(2);
//   var fn = react();
//   var errors = fn.setAndValidateAST({
//     inParams: ['a', 'b'],
//     tasks: [    
//       { f: multiply, a: ['a', 'b'], cb: ['c'] },
//       { f: add, a: ['c', 'b'], cb: ['d'] }
//     ],
//     outTask: { a: ['d'] }
//   });
//   t.deepEqual(errors, [], 'no validation errors');

//   function promised(x) {
//     var deferred = react.options.promiseModule.defer();
//     setTimeout(function () { deferred.resolve(x); }, 100);
//     return deferred.promise;
//   }

//   function promisedFails(x) {
//     var deferred = react.options.promiseModule.defer();
//     setTimeout(function () { deferred.reject(new Error('my-error')); }, 100);
//     return deferred.promise;
//   }

//   var p2 = promisedFails(2);
//   var p3 = promised(3);

//   var promise = fn(p2, p3, react.options.promiseModule);
//   promise.then(function (d) {
//     t.fail('should not go here, errored');
//   }, function (err) {
//     t.equal(err.message, 'my-error', 'error should be passed');
//     t.end();
//   });
// });  

// test('multi-step promise two ret value', function (t) {
//   t.plan(3);
//   var fn = react();
//   var errors = fn.setAndValidateAST({
//     inParams: ['a', 'b'],
//     tasks: [    
//       { f: multiply, a: ['a', 'b'], cb: ['c'] },
//       { f: add, a: ['c', 'b'], cb: ['d'] }
//     ],
//     outTask: { a: ['c', 'd'] }
//   });
//   t.deepEqual(errors, [], 'no validation errors');

//   var promise = fn(2, 3, Promise);
//   promise.then(function (results) {
//     t.equal(results.c, 6);
//     t.equal(results.d, 9);
//     t.end();
//   });
// });  

// test('multi-step promise with error', function (t) {
//   t.plan(2);
//   var fn = react();
//   var errors = fn.setAndValidateAST({
//     inParams: ['a', 'b'],
//     tasks: [    
//       { f: multiply, a: ['a', 'b'], cb: ['c'] },
//       { f: badF2, a: ['c', 'b'], cb: ['d'] }
//     ],
//     outTask: { a: ['c', 'd'] }
//   });
//   t.deepEqual(errors, [], 'no validation errors');

//   var promise = fn(2, 3, Promise);
//   promise.then(function (arr) {
//     t.fail('should not succeed');
//   }, function(err) {
//     t.equal(err.message, 'my-error');
//     t.end();
//   });
// });  

// test('selectFirst promise', function (t) {
//   t.plan(5);
//   var fn = react();
//   var errors = fn.setAndValidateAST({
//     inParams: ['a', 'b'],
//     tasks: [    
//       { f: multiply, a: ['a', 'b'], cb: ['c'] },
//       { f: add, a: ['a', 'b'], cb: ['c'], after: ['multiply'] }
//     ],
//     outTask: { type: 'finalcbFirst', a: ['c'] }
//   });
//   t.deepEqual(errors, [], 'no validation errors');

//   var events = []
//   function accumEvents(name, results, task) {
//     events.push( { name: name, results: results, task: task } );
//   }
//   fn.events.on('taskComplete', accumEvents);

//   var promise = fn(2, 3, Promise);
//   promise.then(function (c) {
//     t.equal(c, 6);
//     t.equal(events.length, 1, 'should have seen one task compl events');
//     t.equal(events[0].name, 'multiply', 'name matches');
//     t.deepEqual(events[0].results, [6], 'results match');
//     t.end();
//   });
// });  

// test('selectFirst promise errors', function (t) {
//   t.plan(3);
//   var fn = react();
//   var errors = fn.setAndValidateAST({
//     inParams: ['a', 'b'],
//     tasks: [    
//       { f: badF2, a: ['a', 'b'], cb: ['c'] },
//       { f: add, a: ['a', 'b'], cb: ['c'], after: ['badF2'] }
//     ],
//     outTask: { type: 'finalcbFirst', a: ['c'] }
//   });
//   t.deepEqual(errors, [], 'no validation errors');

//   var events = []
//   function accumEvents(name, results, task) {
//     events.push( { name: name, results: results, task: task } );
//   }
//   fn.events.on('taskComplete', accumEvents);

//   var promise = fn(2, 3, Promise);
//   promise.then(function (c) {
//     t.fail('should not get here');
//   }, function (err) {
//     t.equal(err.message, 'my-error');
//     t.equal(events.length, 0, 'should have seen one task compl events');
//     t.end();
//   });
// });  





// test('multi-step Qpromise single ret value', function (t) {
//   t.plan(2);
//   var fn = react();
//   var errors = fn.setAndValidateAST({
//     inParams: ['a', 'b'],
//     tasks: [    
//       { f: multiply, a: ['a', 'b'], cb: ['c'] },
//       { f: add, a: ['c', 'b'], cb: ['d'] }
//     ],
//     outTask: { a: ['d'] }
//   });
//   t.deepEqual(errors, [], 'no validation errors');

//   var promise = fn(2, 3, QPromise);
//   promise.then(function (d) {
//     t.equal(d, 9);
//     t.end();
//   });
// });  

// test('multi-step Qpromise two ret value', function (t) {
//   t.plan(3);
//   var fn = react();
//   var errors = fn.setAndValidateAST({
//     inParams: ['a', 'b'],
//     tasks: [    
//       { f: multiply, a: ['a', 'b'], cb: ['c'] },
//       { f: add, a: ['c', 'b'], cb: ['d'] }
//     ],
//     outTask: { a: ['c', 'd'] }
//   });
//   t.deepEqual(errors, [], 'no validation errors');

//   var promise = fn(2, 3, QPromise);
//   promise.then(function (results) {
//     t.equal(results.c, 6);
//     t.equal(results.d, 9);
//     t.end();
//   });
// });  

// test('multi-step Qpromise with error', function (t) {
//   t.plan(2);
//   var fn = react();
//   var errors = fn.setAndValidateAST({
//     inParams: ['a', 'b'],
//     tasks: [    
//       { f: multiply, a: ['a', 'b'], cb: ['c'] },
//       { f: badF2, a: ['c', 'b'], cb: ['d'] }
//     ],
//     outTask: { a: ['c', 'd'] }
//   });
//   t.deepEqual(errors, [], 'no validation errors');

//   var promise = fn(2, 3, QPromise);
//   promise.then(function (arr) {
//     t.fail('should not succeed');
//   }, function(err) {
//     t.equal(err.message, 'my-error');
//     t.end();
//   });
// });  