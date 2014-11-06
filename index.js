'use strict';

var BOWER_COMPONENT_REGISTRY = process.env.BOWER_COMPONENT_REGISTRY || 'https://bower-component-list.herokuapp.com/';

var bowerp = require('bowerp').commands;
var requestp = require('requestp');


/**
 * [getBowerPackages description]
 *
 * @param  {Number}   since      [description]
 * @param  {Function} filterFunc [description]
 * @return {Array}               [description]
 */
exports.getBowerPackages = function getBowerPackages(since, filterFunc) {
  filterFunc = filterFunc || noop;
  return requestp({
    uri: BOWER_COMPONENT_REGISTRY,
    json: true
  }).then(function (packages) {
    return packages.map(function (pkg) {
      // Convert date strings to Date objects.
      ['created', 'updated'].forEach(function (key) {
        pkg[key] = new Date(pkg[key]);
      });
      return pkg;
    }).sort(sortBy('updated'));
  }).then(filterPackages(since)).then(filterFunc).then(mergeBowerData);
};


/**
 * [filterPackages description]
 *
 * @param  {Number}   msAgo [description]
 * @return {Function}       [description]
 */
function filterPackages(msAgo) {
  var lastUpdatedMs = Date.now() - msAgo;
  return function (packages) {
    return packages.filter(function (pkg) {
      return (pkg.updated >= lastUpdatedMs);
    });
  };
}


/**
 * [mergeBowerData description]
 *
 * @param  {Array} packages [description]
 * @return {Array}          [description]
 */
function mergeBowerData(packages) {
  return packages.map(function (pkg) {
    return bowerp.info(pkg.name).then(function (data) {
      var obj = data.latest;
      // Copy over all the bower registry keys into the results from `bower.command.info()`.
      Object.keys(pkg).forEach(function (key) {
        obj[key] = pkg[key];
      });
      return obj;
    });
  });
}


/**
 * Do nothing, just return the source array to keep the promise chain unbroken.
 *
 * @param  {Array} packages [description]
 * @return {Array}          [description]
 */
function noop(packages) {
  return packages;
}


/**
 * [sortBy description]
 *
 * @param  {String}   key [description]
 * @return {Function}     [description]
 */
function sortBy(key) {
  return function (itemA, itemB) {
    return itemB[key] - itemA[key];
  };
}
