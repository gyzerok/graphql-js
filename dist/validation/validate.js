
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _interopRequireWildcard = require('babel-runtime/helpers/interop-require-wildcard')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.validate = validate;

var _jsutilsInvariant = require('../jsutils/invariant');

var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);

var _error = require('../error');

var _languageVisitor = require('../language/visitor');

var _languageKinds = require('../language/kinds');

var Kind = _interopRequireWildcard(_languageKinds);

var _typeSchema = require('../type/schema');

var _utilitiesTypeInfo = require('../utilities/TypeInfo');

var _specifiedRules = require('./specifiedRules');

/**
 * Implements the "Validation" section of the spec.
 *
 * Validation runs synchronously, returning an array of encountered errors, or
 * an empty array if no errors were encountered and the document is valid.
 *
 * A list of specific validation rules may be provided. If not provided, the
 * default list of rules defined by the GraphQL specification will be used.
 *
 * Each validation rules is a function which returns a visitor
 * (see the language/visitor API). Visitor methods are expected to return
 * GraphQLErrors, or Arrays of GraphQLErrors when invalid.
 *
 * Visitors can also supply `visitSpreadFragments: true` which will alter the
 * behavior of the visitor to skip over top level defined fragments, and instead
 * visit those fragments at every point a spread is encountered.
 */

function validate(schema, ast, rules) {
  (0, _jsutilsInvariant2['default'])(schema, 'Must provide schema');
  (0, _jsutilsInvariant2['default'])(ast, 'Must provide document');
  (0, _jsutilsInvariant2['default'])(_typeSchema.GraphQLSchema.isPrototypeOf(schema), 'Schema must be an instance of GraphQLSchema. Also ensure that there are ' + 'not multiple versions of GraphQL installed in your node_modules directory.');
  return visitUsingRules(schema, ast, rules || _specifiedRules.specifiedRules);
}

/**
 * This uses a specialized visitor which runs multiple visitors in parallel,
 * while maintaining the visitor skip and break API.
 */
function visitUsingRules(schema, documentAST, rules) {
  var typeInfo = new _utilitiesTypeInfo.TypeInfo(schema);
  var context = new ValidationContext(schema, documentAST, typeInfo);
  var errors = [];

  function visitInstance(ast, instance) {
    (0, _languageVisitor.visit)(ast, {
      enter: function enter(node, key) {
        // Collect type information about the current position in the AST.
        typeInfo.enter(node);

        // Do not visit top level fragment definitions if this instance will
        // visit those fragments inline because it
        // provided `visitSpreadFragments`.
        var result;
        if (node.kind === Kind.FRAGMENT_DEFINITION && key !== undefined && instance.visitSpreadFragments) {
          return false;
        }

        // Get the visitor function from the validation instance, and if it
        // exists, call it with the visitor arguments.
        var enter = (0, _languageVisitor.getVisitFn)(instance, false, node.kind);
        result = enter ? enter.apply(instance, arguments) : undefined;

        // If the visitor returned an error, log it and do not visit any
        // deeper nodes.
        if (result && isError(result)) {
          append(errors, result);
          result = false;
        }

        // If any validation instances provide the flag `visitSpreadFragments`
        // and this node is a fragment spread, visit the fragment definition
        // from this point.
        if (result === undefined && instance.visitSpreadFragments && node.kind === Kind.FRAGMENT_SPREAD) {
          var fragment = context.getFragment(node.name.value);
          if (fragment) {
            visitInstance(fragment, instance);
          }
        }

        // If the result is "false", we're not visiting any descendent nodes,
        // but need to update typeInfo.
        if (result === false) {
          typeInfo.leave(node);
        }

        return result;
      },
      leave: function leave(node) {
        // Get the visitor function from the validation instance, and if it
        // exists, call it with the visitor arguments.
        var leave = (0, _languageVisitor.getVisitFn)(instance, true, node.kind);
        var result = leave ? leave.apply(instance, arguments) : undefined;

        // If the visitor returned an error, log it and do not visit any
        // deeper nodes.
        if (result && isError(result)) {
          append(errors, result);
          result = false;
        }

        // Update typeInfo.
        typeInfo.leave(node);

        return result;
      }
    });
  }

  // Visit the whole document with each instance of all provided rules.
  var instances = rules.map(function (rule) {
    return rule(context);
  });
  instances.forEach(function (instance) {
    visitInstance(documentAST, instance);
  });

  return errors;
}

function isError(value) {
  return Array.isArray(value) ? value.every(function (item) {
    return item instanceof _error.GraphQLError;
  }) : value instanceof _error.GraphQLError;
}

function append(arr, items) {
  if (Array.isArray(items)) {
    arr.push.apply(arr, items);
  } else {
    arr.push(items);
  }
}

/**
 * An instance of this class is passed as the "this" context to all validators,
 * allowing access to commonly useful contextual information from within a
 * validation rule.
 */

var ValidationContext = (function () {
  function ValidationContext(schema, ast, typeInfo) {
    _classCallCheck(this, ValidationContext);

    this._schema = schema;
    this._ast = ast;
    this._typeInfo = typeInfo;
  }

  _createClass(ValidationContext, [{
    key: 'getSchema',
    value: function getSchema() {
      return this._schema;
    }
  }, {
    key: 'getDocument',
    value: function getDocument() {
      return this._ast;
    }
  }, {
    key: 'getFragment',
    value: function getFragment(name) {
      var fragments = this._fragments;
      if (!fragments) {
        this._fragments = fragments = this.getDocument().definitions.reduce(function (frags, statement) {
          if (statement.kind === Kind.FRAGMENT_DEFINITION) {
            frags[statement.name.value] = statement;
          }
          return frags;
        }, {});
      }
      return fragments[name];
    }
  }, {
    key: 'getType',
    value: function getType() {
      return this._typeInfo.getType();
    }
  }, {
    key: 'getParentType',
    value: function getParentType() {
      return this._typeInfo.getParentType();
    }
  }, {
    key: 'getInputType',
    value: function getInputType() {
      return this._typeInfo.getInputType();
    }
  }, {
    key: 'getFieldDef',
    value: function getFieldDef() {
      return this._typeInfo.getFieldDef();
    }
  }, {
    key: 'getDirective',
    value: function getDirective() {
      return this._typeInfo.getDirective();
    }
  }, {
    key: 'getArgument',
    value: function getArgument() {
      return this._typeInfo.getArgument();
    }
  }]);

  return ValidationContext;
})();

exports.ValidationContext = ValidationContext;