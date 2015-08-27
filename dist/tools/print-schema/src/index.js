/* eslint-disable no-console */
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.executeTool = executeTool;

var _languageSchema = require('../../../language/schema/');

var _utilities = require('../../../utilities/');

var _ = require('../../../');

var Promise = require('bluebird');
var parseArgs = require('minimist');
var fs = require('fs');

Promise.promisifyAll(fs);

function executeTool() {
  var argDict, body, ast, astSchema, result, out;
  return _regeneratorRuntime.async(function executeTool$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.prev = 0;
        argDict = parseArgs(process.argv.slice(2));

        if (argDict['?'] !== undefined || argDict.help !== undefined) {
          console.log(helpString);
          process.exit(0);
        }

        if (argDict.query === undefined) {
          console.log('--query is required');
          console.log(helpString);
          process.exit(0);
        }

        if (argDict.file === undefined) {
          console.log('--file is required');
          console.log(helpString);
          process.exit(0);
        }

        context$1$0.next = 7;
        return _regeneratorRuntime.awrap(fs.readFileAsync(argDict.file, 'utf8'));

      case 7:
        body = context$1$0.sent;
        ast = (0, _languageSchema.parseSchemaIntoAST)(body);
        astSchema = (0, _utilities.buildASTSchema)(ast, argDict.query, argDict.mutation);
        context$1$0.next = 12;
        return _regeneratorRuntime.awrap((0, _.graphql)(astSchema, _utilities.introspectionQuery));

      case 12:
        result = context$1$0.sent;
        context$1$0.next = 15;
        return _regeneratorRuntime.awrap(JSON.stringify(result, null, 2));

      case 15:
        out = context$1$0.sent;

        console.log(out);
        context$1$0.next = 23;
        break;

      case 19:
        context$1$0.prev = 19;
        context$1$0.t0 = context$1$0['catch'](0);

        console.error(context$1$0.t0);
        console.error(context$1$0.t0.stack);

      case 23:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this, [[0, 19]]);
}

var helpString = '\nThis tool consumes GraphQL schema definition files and outputs the\nintrospection query result from querying that schema.\n\nRequired:\n\n--file <path>: The path to the input schema definition file.\n--query <queryType>: The query type (root type) of the schema.\n\nOptional:\n\n--mutation <mutationType>: The mutation type (root type) of the schema.';