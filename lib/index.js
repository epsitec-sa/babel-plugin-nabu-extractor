'use strict';

const nabuExtractor = require ('nabu-extractor');

/*
 * Inspired by the work of Yahoo for babel-plugin-react-intl.
 */

const COMPONENT_NAMES = ['T'];
const DESCRIPTOR_PROPS = new Set (['msgid', 'desc']);

module.exports = function () {
  function getModuleSourceName (opts) {
    return opts.moduleSourceName || 'react-nabu';
  }

  function getTkey (path) {
    if (path.isIdentifier () || path.isJSXIdentifier ()) {
      return path.node.name;
    }

    let evaluated = path.evaluate ();
    if (evaluated.confident) {
      return evaluated.value;
    }

    throw path.buildCodeFrameError (
      '[T] msgid must be statically evaluate-able for extraction.'
    );
  }

  function getTvalue (path) {
    if (path.isJSXExpressionContainer ()) {
      path = path.get ('expression');
    }

    let evaluated = path.evaluate ();
    if (evaluated.confident) {
      return evaluated.value;
    }

    throw path.buildCodeFrameError (
      '[T] msgid must be statically evaluate-able for extraction.'
    );
  }

  function createTdescriptor (propPaths, options) {
    if (!options) {
      options = {};
    }
    const isJSXSource = options.isJSXSource || false;

    return propPaths.reduce ((hash, arr) => {
      let keyPath = arr[0];
      let valuePath = arr[1];
      let locPath = arr[2];

      let key = getTkey (keyPath);

      if (!DESCRIPTOR_PROPS.has (key)) {
        return hash;
      }

      hash[key] = {
        value: getTvalue (valuePath).trim (),
        loc: locPath.node,
      };
      return hash;
    }, {});
  }

  function storeMessage (msg, path, state) {
    state.T.messages.push (msg);
  }

  function referencesImport (path, mod, importedNames) {
    if (!(path.isIdentifier () || path.isJSXIdentifier ())) {
      return false;
    }

    return importedNames.some (name => path.referencesImport (mod, name));
  }

  return {
    visitor: {
      Program: {
        enter (path, state) {
          state.T = {
            messages: [],
          };
        },

        exit (path, state) {
          const {file} = state;
          file.metadata['react-nabu'] = state.T;
          state.T.messages.forEach (msg =>
            nabuExtractor (msg.msgid.value, msg.msgid.desc)
          );
        },
      },

      JSXOpeningElement (path, state) {
        const opts = state.opts;
        const moduleSourceName = getModuleSourceName (opts);

        const name = path.get ('name');

        if (referencesImport (name, moduleSourceName, COMPONENT_NAMES)) {
          const attributes = path
            .get ('attributes')
            .filter (attr => attr.isJSXAttribute ());

          const descriptor = createTdescriptor (
            attributes.map (attr => [
              attr.get ('name'),
              attr.get ('value'),
              attr.get ('loc'),
            ]),
            {
              isJSXSource: true,
            }
          );

          storeMessage (descriptor, path, state);
        }
      },

      CallExpression () {},
    },
  };
};
