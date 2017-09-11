/* eslint-disable global-require */

module.exports = function linariaBabelPreset(context, opts = {}) {
  return {
    plugins: [
      [require('./build/babel/plugins/better-names').default, opts],
      [require('./build/babel/plugins/preval-extract').default, opts],
      [require('./build/babel/plugins/rewire-imports').default, opts],
    ],
  };
};
