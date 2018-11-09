const path = require('path');
const {
  mapProgramInputToConfig,
  addConfigFileInfoToConfig,
  resolvePropertyValuesToConfig,
} = require('./configMapper');
const {
  locateTemplates,
  readAndParseTemplate,
  writeTemplate
} = require('./templateUtil');

exports.main = async (program) => {
  let config;
  try {
    config = mapProgramInputToConfig(program);
  } catch (e) {
    throw new Error('Unable to read program input');
  }
  try {
    config = addConfigFileInfoToConfig(config);
  } catch (e) {
    throw new Error(`Unable to read config file ${config.configFile.resolvedPath}`);
  }

  config = resolvePropertyValuesToConfig(config);

  if (!config.input.resolvedPath) {
    throw new Error('An input file or directory was not specified');
  }

  locateTemplates(config.input.resolvedPath).forEach((template) => {
    const templateBody = readAndParseTemplate(template.path, config.properties);
    writeTemplate(
      path.join(config.output.resolvedPath, template.name),
      templateBody
    );
  });
};