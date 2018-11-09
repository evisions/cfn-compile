const fs = require('fs');
const path = require('path');
const mustache = require('mustache');
const mkdirp = require('mkdirp');

exports.locateTemplates = (templatePath) => {
  const locatedTemplates = [];
  const stat = fs.lstatSync(templatePath);
  if (stat.isDirectory()) {
    fs.readdirSync(templatePath, 'utf8').forEach((fileName) => {
      locatedTemplates.push({
        path: path.join(templatePath, fileName),
        name: fileName,
      });
    });
  } else {
    locatedTemplates.push({
      path: templatePath,
      name: path.basename(templatePath),
    });
  }
  return locatedTemplates;
}

exports.readAndParseTemplate = (templatePath, properties) => {
  const templateBody = fs.readFileSync(templatePath, 'utf8');
  return mustache.render(templateBody, properties);
}

exports.writeTemplate = (templatePath, templateBody) => {
  mkdirp.sync(path.dirname(templatePath));
  fs.writeFileSync(templatePath, templateBody, 'utf8');
}