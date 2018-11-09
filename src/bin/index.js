const mustache = require('mustache');
const program = require('commander');
const mkdirp = require('mkdirp');
const yaml = require('node-yaml');
const path = require('path');
const fs = require('fs');

program
    .option('-i, --input <value>', 'Input directory')
    .option('-c, --config <value>', 'cfnc config file', path.join(process.cwd(), '.cfnc.json'))
    .option('-O, --output <value>', 'Output directory')
    .parse(process.argv);

let configDto;
let outputDirectory = program.output;
let inputDirectory;
let inputTemplates = [];

try {
  const configFileString = fs.readFileSync(path.resolve(program.config), 'utf8');
  if (program.config.endsWith('json')) {
    configDto = JSON.parse(configFileString);
  } else if (program.config.endsWith('yml') || program.config.endsWith('yaml')) {
    configDto = yaml.parse(configFileString);
  }
} catch (e) {
  console.log(e.message);
  console.error(`Unable to read file at ${program.config}`);
  process.exit(1);
}

if (!program.input) {
  if (!configDto.input) {
    console.error('An "input" value was not specified.')
    process.exit(1);
  }
  if (configDto.input.indexOf('/') === 0) {
    inputDirectory = path.resolve(configDto.input);
  } else {
    inputDirectory = path.join(
      path.dirname(path.resolve(program.config)),
      configDto.input
    );
  }
} else {
  inputDirectory = path.resolve(program.input);
}

if (!outputDirectory) {
  outputDirectory = configDto.output ? configDto.output : 'build';
}
if (outputDirectory.indexOf('/') !== 0) {
  outputDirectory = path.join(
    path.dirname(path.resolve(program.config)),
    outputDirectory
  );
}

try {
  const stat = fs.lstatSync(inputDirectory);
  if (stat.isDirectory()) {
    fs.readdirSync(inputDirectory, 'utf8').forEach((fileName) => {
      console.log(fileName);
      inputTemplates.push({
        input: path.join(inputDirectory, fileName),
        output: path.join(outputDirectory, fileName),
        name: fileName,
      });
    });
  } else {
    inputTemplates.push({
      input: inputDirectory,
      output: path.join(
        outputDirectory,
        path.basename(inputDirectory)
      ),
      name: path.basename(inputDirectory),
    });
  }
} catch (e) {
  console.log(`No Such File/Directory exists: ${inputDirectory}`);
  process.exit(1);
}

inputTemplates.forEach(({ input, output }) => {
  try {
    const intputString = fs.readFileSync(input, 'utf8');
    const outputString = mustache.render(intputString, configDto.properties);
    mkdirp.sync(path.dirname(output));
    fs.writeFileSync(output, outputString, 'utf8');
  } catch(e) {
    console.log(`Unable to to process input file "${input}"`);
    process.exit(1);
  }
});
