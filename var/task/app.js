#!/usr/local/bin/node
// jshint esversion: 8
// npm test

//onst fetch = require('node-fetch');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
var response = {};

// BUCKET="$BUCKET" node -p -e 'const app=require("./var/task/app.js"); app.myHandler({"key": "ok"})'
module.exports.myHandler = (event, context, callback) => {
  //console.log("app.handler( event:" + JSON.stringify(event, null, 2) + ")" );
  let data = JSON.stringify(process.env, null, 2);
  //console.log(data);
  event.s3FilePath = "/tmp/" + event.key + ".txt";
  require("./base.js").writeJSONFile(event.s3FilePath, data);
  //require("./base.js").writeFile(event.s3FilePath, data);

  try {
    return new Promise((resolve, reject) => {
       response = require("./s3.js").putObject(process, event, data, response);
    }).then((response) => {
      if ( response.status == "ok") { context.succeed(JSON.stringify(response)); }
      if ( response.status == "fail") { context.fail(JSON.stringify(response)); }
    });
  } catch (response) {
    context.fail(JSON.stringify(response));
  }

};