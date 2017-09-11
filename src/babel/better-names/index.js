/* @flow */

import type {
  BabelCore,
  BabelTypes,
  NodePath,
  State,
  BabelTaggedTemplateExpression,
} from '../types';

export default (babel: BabelCore) => {
  const { types }: { types: BabelTypes } = babel;

  return {
    visitor: {
      TaggedTemplateExpression(
        path: NodePath<BabelTaggedTemplateExpression<*>>,
        state: State
      ) {
        const { node, parentPath } = path;
        if (types.isIdentifier(node.tag) && node.tag.name === 'css' && parentPath.isVariableDeclarator()) {
          const { name } = parentPath.node.id;
          const env = process.env.BABEL_ENV || process.env.NODE_ENV;
          const args = [types.stringLiteral(name)];

          if (env !== 'production') {
            args.push(types.stringLiteral(state.filename || state.file.opts.filename));
          }

          node.tag =
            types.callExpression(
              types.memberExpression(types.identifier('css'), types.identifier('named')),
              args
            );
        }
      },
    },
  };
};
