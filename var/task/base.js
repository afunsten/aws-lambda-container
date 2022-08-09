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
        }
};

module.exports.writeJSONFileV1 = function(filePath, userData, sort=false) {
    // stringify a json object into a pretty file
    //  node -e 'require("./base.js").writeJSONFileV1("./tests/testFile.json", {});'
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
        console.log("writeJSONFileV1: " + filePath);
        let data = JSON.stringify(userData, null, 2);
        if ( typeof userData !== 'undefined' ) { 
            fs.writeFile(filePath, data, (err) => {
                if (err) throw err;
                console.log('writeJSONFileV1: Data written to file');
            });
         }
        else { console.log("WARN: writeJSONFileV1: userData is undefined");
            fs.writeFile(filePath, data, (err) => {
                if (err) throw err;
                console.log('writeJSONFileV1: Data written to file');
            });
        }      
    } catch (error) {console.log( error + " ERROR: can not writeFile ");}
};

module.exports.writeFileV1 = function(filePath="app.log", data="message", flags='a') {
//  node -p 'require("./base.js").writeFileV1(filePath="app.log", data="message", 'w' );'
    if (fs.existsSync(filePath)) {
        console.log(`writeFileV1: ` + filePath );
    } else {
        console.log(`writeFileV1: ` + filePath );
        exports.createDirectory(path.dirname(filePath));
    }
    var stream = fs.createWriteStream(filePath, { flags: flags });
    stream.write(data);
    stream.on('drain', function () { });
};
