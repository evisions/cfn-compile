const program = require('commander');
const { main } = require('../lib/main');

program
    .option('-i, --input <value>', 'Input directory')
    .option('-c, --config <value>', 'cfnc config file')
    .option('-O, --output <value>', 'Output directory')
    .option('--debug', 'Debug output')
    .parse(process.argv);

main(program)
    .catch((e) => {
      if (program.debug) {
        console.error(e.stack);
      } else {
        console.error(e.message);
      }
      process.exit(1);
    });

