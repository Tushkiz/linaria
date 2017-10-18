/* @flow */

import type {
  BabelCore,
  BabelTypes,
  NodePath,
  State,
  BabelTaggedTemplateExpression,
  BabelIdentifier,
  RequirementSource,
} from '../types';

import {
  shouldTraverseExternalIds,
  isLinariaTaggedTemplate,
  isExcluded,
} from './validators';
import { getSelfBinding } from './utils';
import prevalStyles from './prevalStyles';
import resolveSource from './resolveSource';
import extractStyles from './extractStyles';

export const externalRequirementsVisitor = {
  Identifier(path: NodePath<BabelIdentifier>) {
    if (path.isReferenced() && getSelfBinding(path) && !isExcluded(path)) {
      const source: ?RequirementSource = resolveSource(this.types, path);
      if (
        source &&
        !this.requirements.find(item => item.code === source.code)
      ) {
        this.requirements.splice(this.addBeforeIndex, 0, source);
        const binding = getSelfBinding(path);
        if (shouldTraverseExternalIds(binding.path)) {
          binding.path.traverse(externalRequirementsVisitor, this);
        }
      }
    }
  },
};

export const cssTaggedTemplateRequirementsVisitor = {
  Identifier(path: NodePath<BabelIdentifier>) {
    if (path.isReferenced() && !isExcluded(path)) {
      const source: ?RequirementSource = resolveSource(this.types, path);
      if (
        source &&
        !this.requirements.find(item => item.code === source.code)
      ) {
        this.requirements.push(source);
        this.addBeforeIndex = this.requirements.length - 1;
        const binding = getSelfBinding(path);
        if (shouldTraverseExternalIds(binding.path)) {
          binding.path.traverse(externalRequirementsVisitor, this);
        }
      }
    }
  },
};

export default (babel: BabelCore) => {
  const { types }: { types: BabelTypes } = babel;

  return {
    visitor: {
      Program: {
        enter(path: NodePath<*>, state: State) {
          state.skipFile =
            // $FlowFixMe
            path.container.tokens.findIndex(
              token =>
                token.type === 'CommentBlock' &&
                token.value.includes('linaria-preval')
            ) > -1;
          state.foundLinariaTaggedLiterals = false;
          state.filename = state.file.opts.filename;
        },
        exit(path: NodePath<*>, state: State) {
          if (state.skipFile) {
            return;
          }

          if (state.foundLinariaTaggedLiterals) {
            extractStyles(types, path, state.filename, state.opts);
          }
        },
      },
      TaggedTemplateExpression(
        path: NodePath<BabelTaggedTemplateExpression<any>>,
        state: State
      ) {
        if (!state.skipFile && isLinariaTaggedTemplate(types, path)) {
          let title;
          let isProperty;
          let propertykind;

          if (path.parentPath.isVariableDeclarator()) {
            title = path.parent.id.name;
          } else {
            // TODO: add tests for object properties and JSX
            const parent = path.findParent(
              p => p.isObjectProperty() || p.isJSXOpeningElement()
            );

            if (parent) {
              isProperty = true;

              if (parent.isJSXOpeningElement()) {
                title = parent.node.name.name;
                propertykind = 'expression';
              } else {
                title = parent.node.key.name;
                propertykind = 'value';
              }
            } else {
              throw path.buildCodeFrameError(
                "Couldn't determine the class name for CSS template literal. Ensure that it's either:\n" +
                  '- Assigned to a variable\n' +
                  '- Is an object property\n' +
                  '- Is a prop in a JSX element'
              );
            }
          }

          state.foundLinariaTaggedLiterals = true;

          const requirements: RequirementSource[] = [];

          path.traverse(cssTaggedTemplateRequirementsVisitor, {
            requirements,
            types,
          });

          // TODO: add tests for comment and class name
          const className = prevalStyles(
            babel,
            title,
            path,
            state,
            requirements
          );
          const leadingComments = [
            {
              type: 'CommentBlock',
              value: 'linaria-output',
            },
          ];

          if (isProperty) {
            path.parentPath.node[propertykind] = className;
            /* $FlowFixMe */
            className.leadingComments = leadingComments;
          } else {
            path.parentPath.node.init = className;
            path.parentPath.node.leadingComments = leadingComments;
          }
        }
      },
    },
  };
};
