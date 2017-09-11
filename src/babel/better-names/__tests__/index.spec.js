/* eslint-disable no-template-curly-in-string */
/* @flow */

import * as babel from 'babel-core';
import path from 'path';
import dedent from 'dedent';

function transpile(source, options) {
  return babel.transform(source,
    {
      plugins: [
        require.resolve('../index')
      ],
      babelrc: false,
      ...options
    },
  ).code;
}

it('should convert `css` to `css.named` with filename', () => {
  const env = process.env.NODE_ENV
  process.env.NODE_ENV = 'development';
  const code = transpile(dedent`
  const header = css\`
    font-size: 3em;
  \`;
  `, { filename: 'Header.js' });

  expect(code).toMatchSnapshot();
  process.env.NODE_ENV = env;
});

it('should convert `css` to `css.named` without filename', () => {
  const env = process.env.NODE_ENV
  process.env.NODE_ENV = 'production';
  const code = transpile(dedent`
  const header = css\`
    font-size: 3em;
  \`;
  `, { filename: 'Header.js' });

  expect(code).toMatchSnapshot();
  process.env.NODE_ENV = env;
});


it('should convert `css` to `css.named` for multiple literals', () => {
  const code = transpile(dedent`
  const header = css\`
    font-size: ${'${2 + 1}'}em;
  \`;

  const body = css\`
    border-radius: ${'${2 + 2}'}px;
  \`;
  `);

  expect(code).toMatchSnapshot();
});

it('should not convert `css.named()` literal', () => {
  const code = transpile(dedent`
  const header = css.named('my-header')\`
    font-size: 3em;
  \`;
  `);

  expect(code).toMatchSnapshot();
});

it('should convert non-top-level `css` to `css.named`', () => {
  const code = transpile(dedent`
  const defaults = {
    fontSize: '3em',
  };

  function render() {
    const header = css\`
      font-size: ${'${defaults.fontSize}'};
    \`;
  }
  `);

  expect(code).toMatchSnapshot();
});

it('should not convert random tags', () => {
  const code = transpile(dedent`
  const header = scss\`
    font-size: 3em;
  \`;
  `, { filename: 'Header.js' });

  expect(code).toMatchSnapshot();
});
