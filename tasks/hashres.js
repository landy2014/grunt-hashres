/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2012 Luismahou
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {

  // Loading necessary modules
  var fs = require('fs'),
      path = require('path'),
      crypto = require('crypto');

  grunt.registerMultiTask(
      'hashres',
      'Hashes your resources and updates the files that refer to them',
      function() {
    // Required properties: 'files' and 'out'
    this.requiresConfig(this.name + '.' + this.target + '.files');
    this.requiresConfig(this.name + '.' + this.target + '.out');
    grunt.helper('hashAndSub', this.data.files, this.data.out, this.data.encoding);
  });
  grunt.registerHelper('hashAndSub', function(files, out, encoding) {
    grunt.log.ok('out: ' + out);
    var nameToHashedName = {};
    encoding = (encoding || 'utf8');
    grunt.log.debug('Using encoding ' + encoding);

    // Converting the file to an array if is only one
    files = Array.isArray(files) ? files : [files];
    out = Array.isArray(out) ? out : [out];

    // Renaming the files using a unique name
    grunt.file.expand(files).forEach(function(f) {
      var md5 = grunt.helper('md5', f),
          fileName = path.basename(f),
          lastIndex = fileName.lastIndexOf('.'),
          renamed = [
            md5.slice(0, 8), // Starging the file with the hash that would make it unique
            fileName.slice(0, lastIndex), // Real name of the file
            'cache', // Good to have to ease apache configuration to enable 'perfect caching'
            fileName.slice(lastIndex + 1, fileName.length) // Extension of the file
          ].join('.');

      // Mapping the original name with hashed one for later use.
      nameToHashedName[fileName] = renamed;

      // Renaming the file
      fs.renameSync(f, path.resolve(path.dirname(f), renamed));
      grunt.log.write(f + ' ').ok(renamed);
    });

    // Substituting references to the given files with the hashed ones.
    grunt.file.expand(out).forEach(function(f) {
      var outContents = fs.readFileSync(f, encoding);
      for (var name in nameToHashedName) {
        grunt.log.debug('Substituting ' + name + ' by ' + nameToHashedName[name]);
        outContents = outContents.replace(name, nameToHashedName[name]);
      }
      grunt.log.debug('Saving the updated contents of the outination file');
      fs.writeFileSync(f, outContents, encoding);
    });
  });
  // **md5** helper is a basic wrapper around crypto.createHash, with
  // given `algorithm` and `encoding`. Both are optional and defaults to
  // `md5` and `hex` values.
  grunt.registerHelper('md5', function(filepath, algorithm, encoding) {
    algorithm = algorithm || 'md5';
    encoding = encoding || 'hex';
    var hash = crypto.createHash(algorithm);
    hash.update(grunt.file.read(filepath));
    grunt.log.verbose.write('Hashing ' + filepath + '...');
    return hash.digest(encoding);
  });

};