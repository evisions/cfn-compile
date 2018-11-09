const path = require('path');
const fs = require('fs');
const yaml = require('node-yaml');
const shell = require('shelljs');

exports.resolvePath = (pathValue, { workingDir } = {}) => {
  if (pathValue == null) {
    return null;
  } else if (pathValue.trim().length === 0) {
    return null;
  } else if (pathValue.startsWith('/')) {
    return pathValue;
  } else {
    return path.join(workingDir || process.cwd(), pathValue);
  }
}

exports.readConfigFileData = ({ configFile }) => {
  if (configFile.resolvedPath == null) {
    return null;
  }
  const configFileString = fs.readFileSync(configFile.resolvedPath, 'utf8');
  if (configFile.rawValue.endsWith('json')) {
    return JSON.parse(configFileString);
  } else if (configFile.rawValue.endsWith('yml') || program.config.endsWith('yaml')) {
    return yaml.parse(configFileString);
  }
  return  null;
} 

exports.addConfigFileInfoToConfig = (config) => {
  const data = exports.readConfigFileData(config);
  if (data == null) {
    return config;
  }
  const configFileDirPath = path.dirname(config.configFile.resolvedPath);
  return {
    ...config,
    ...data,
    cwd: configFileDirPath,
    input: config.input.rawValue ? config.input : {
      ...config.input,
      rawValue: data.input,
      resolvedPath: exports.resolvePath(data.input, { workingDir: configFileDirPath }),
    },
    output: config.output.rawValue ? config.output : {
      ...config.output,
      rawValue: data.output,
      resolvedPath: exports.resolvePath(data.output || config.output.defaultValue, { workingDir: configFileDirPath })
    },
  };
}

exports.mapProgramInputToConfig = (program) => {
  return {
    cwd: process.cwd(),
    input: {
      rawValue: program.input,
      resolvePath: exports.resolvePath(program.input),
    },
    output: {
      rawValue: program.output,
      resolvedPath: exports.resolvePath(program.output || '.cfnc/build'),
      defaultValue: '.cfnc/build',
    },
    configFile: {
      rawValue: program.config,
      resolvedPath: exports.resolvePath(program.config || '.cfnc.json'),
      defaultValue: '.cfnc.json',
    }
  };
};

exports.resovlePropertyValue = (propertyValue, config) => {
  if (propertyValue.exec) {
    const result = shell.exec(propertyValue.exec, {
      silent: true,
      cwd: config.cwd,
      env: process.env
    });
    return result.stdout == null ? null : String(result.stdout).trim();
  } else if (propertyValue.env) {
    return process.env[propertyValue.env];
  }
  return null;
}

exports.resolvePropertyValuesToConfig = (config) => {
  const propertyKeys = Object.keys(config.properties);
  const outputProperties = {};
  propertyKeys.forEach((key) => {
    const propertyValue = config.properties[key];
    if (typeof propertyValue === 'string') {
      outputProperties[key] = propertyValue;
    } else {
      outputProperties[key] = exports.resovlePropertyValue(propertyValue, config);
    }
  });

  return {
    ...config,
    properties: outputProperties,
  };
}