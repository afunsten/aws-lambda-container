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
  process.env.Output_FilePath = "/tmp/env." + event.key + ".txt";
  require("./base.js").writeJSONFileV1(process.env.Output_FilePath, data);
  // require("./base.js").writeFileV1( process.env.Output_FilePath, data, 'w');

  // get s3 file
  let getObject_response = require("./s3.js").getObjectV1(process.env.S3_BUCKET, process.env.S3_Input_FilePath).then((res) => {
    console.log(JSON.stringify(res, null, 2));
    console.log(res.Body);
    if (res.status == "ok") { console.log(value.data.Body.toString('utf-8')); }
  });

  // put s3 file
  try {
    return new Promise((resolve, reject) => {
      let putObject_response = require("./s3.js").putObjectV1(process.env.S3_BUCKET, process.env.S3_Output_FilePath, data, response);
    }).then((putObject_response) => {
      if ( putObject_response.status == "ok") { context.succeed(JSON.stringify(response)); }
      if ( putObject_response.status == "fail") { context.fail(JSON.stringify(response)); }
    });
  } catch (putObject_response) {
    context.fail(JSON.stringify(putObject_response));
  }
  
  return response;
};
