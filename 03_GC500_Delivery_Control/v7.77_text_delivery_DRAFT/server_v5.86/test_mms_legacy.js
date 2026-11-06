/* Author: Andrew Fisher. Run all original MMS checks against this draft with only the build label changed. */
'use strict';
const fs = require('fs'), path = require('path'), Module = require('module');
const original = path.join(__dirname, '../../v7.57_text_it_to_me_with_the_map_picture_LIVE/server_v5.85/test_mms.js');
const source = fs.readFileSync(original, 'utf8').replaceAll('v5.85', 'v5.86');
const check = new Module(path.join(__dirname, 'legacy_mms_checks.js'), module);
check.filename = path.join(__dirname, 'legacy_mms_checks.js');
check.paths = Module._nodeModulePaths(__dirname);
check._compile(source, check.filename);
