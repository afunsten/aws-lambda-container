#!/usr/local/bin/node
/*jshint esversion: 6 */
//  ./base.js
// ./node_modules/jshint/bin/jshint ./base.js
// tests inline

const fs = require("fs");
const path = require('path');
const callback = err => {
    if (err) {throw err;}
};

module.exports.createDirectory = function(userDirectory) {
    //  recursive create userDirectory
    //  node -e 'let res=require("./base.js").createDirectory("../node_modules/testxyz"); console.log(res)'
        if (fs.existsSync(userDirectory)) {
            let mkdirResult = "createDirectory: " + userDirectory + " : exists";
            console.log(mkdirResult);
            //process.exit(1);
            return mkdirResult;
        } else {
            console.log("createDirectory: " + userDirectory);
            return fs.mkdirSync(userDirectory, { recursive: true });
            //fs.mkdir(userDirectory, callback)
        }
};

module.exports.writeJSONFile = function(filePath, userData, sort=true) {
    // stringify a json object into a pretty file
    //  node -e 'require("./base.js").writeJSONFile("./tests/testFile.json", {});'
    //console.log(userData);
        if (sort) {
            const sorted_userData = {};
            Object.keys(userData).sort().forEach(function(key) {
                sorted_userData[key] = userData[key];
            });
            userData = sorted_userData;
        }
        const userDirectory = path.dirname(filePath);
        try {
            exports.createDirectory(userDirectory);
        } catch (error) {console.log( error );}
        try {
            console.log("writeJSONFile: " + filePath);
            if ( typeof userData !== 'undefined' ) { fs.writeFile(filePath, JSON.stringify(userData, null, 3), callback); }
            else { console.log("WARN: userData is undefined");
                fs.writeFile(filePath, JSON.stringify("undefined", null, 3), callback);
            }      
        } catch (error) {console.log( error + " ERROR: can not writeFile ");}
};

module.exports.writeFile = function(filePath="app.log", data="message") {
//  node -p 'require("./base.js").writeFile(filePath="app.log", message="message");'
    if (fs.existsSync(filePath)) {
        console.log(`writeFile : ` + filePath );
    } else {
        console.log(`writeFile : ` + filePath );
        exports.createDirectory(path.dirname(filePath));
    }
    var stream = fs.createWriteStream(filePath, { flags: 'a' });
    stream.write(`${data}\n`);
    stream.on('drain', function () { });
};