/* @flow */

import shortid from 'shortid';
import stylis from 'stylis';
import sheet from './sheet';

const all = sheet();

const named = (name, id = shortid()) => (template, ...expressions) => {
  const styles = template.reduce(
    (accumulator, part, i) => accumulator + expressions[i - 1] + part
  );

  const selector = name ? `.${name}[data-css~=${id}]` : `.${id}`;
  const rules = stylis({ selector, styles });

  all.insert(rules);

  return name || id;
};

const css = named();

css.named = named;

export default css;
