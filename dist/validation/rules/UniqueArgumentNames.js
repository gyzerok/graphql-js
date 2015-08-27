
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _Object$create = require('babel-runtime/core-js/object/create')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.duplicateArgMessage = duplicateArgMessage;
exports.UniqueArgumentNames = UniqueArgumentNames;

var _error = require('../../error');

function duplicateArgMessage(argName) {
  return 'There can be only one argument named "' + argName + '".';
}

/**
 * Unique argument names
 *
 * A GraphQL field or directive is only valid if all supplied arguments are
 * uniquely named.
 */

function UniqueArgumentNames() {
  var knownArgNames = _Object$create(null);
  return {
    Field: function Field() {
      knownArgNames = _Object$create(null);
    },
    Directive: function Directive() {
      knownArgNames = _Object$create(null);
    },
    Argument: function Argument(node) {
      var argName = node.name.value;
      if (knownArgNames[argName]) {
        return new _error.GraphQLError(duplicateArgMessage(argName), [knownArgNames[argName], node.name]);
      }
      knownArgNames[argName] = node.name;
    }
  };
}