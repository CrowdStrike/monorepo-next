'use strict';

module.exports = {
  command: 'cycles',
  describe: 'detect circular references',
  builder: {
    'detect-dev-dependencies': {
      describe: 'alert when there is a devDependency in the loop',
      alias: ['dev'],
      type: 'boolean',
      default: false,
    },
  },
  async handler(argv) {
    const detectCircularReferences = require('../../src/detect-circular-references');

    let cycles = await detectCircularReferences({
      ...argv,
      shouldDetectDevDependencies: argv['detect-dev-dependencies'],
    });

    for (let cycle of cycles) {
      console.log(cycle);
    }
  },
};
