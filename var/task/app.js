#!/usr/local/bin/node
// jshint esversion: 8
// npm test

const fetch = require('node-fetch');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// BUCKET="$BUCKET" node -p -e 'const app=require("./var/task/app.js"); app.myHandler({"key": "ok"})'
module.exports.myHandler = (event, context, callback) => {
  console.log("app.handler( event:" + JSON.stringify(event, null, 2) + ")" );
  let env = "ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2);
  //console.log(env);
  //console.warn("warn example.");
  //return env;
  
  // fetch(event.url)
  //   .then((response) => {
  //     if (response.ok) {
  //       return response;
  //     }
  //     return Promise.reject(new Error(
  //           `Failed to fetch ${response.url}: ${response.status} ${response.statusText}`));
  //   })
  //   .then(response => response.buffer())
  //   .then(buffer => (
      s3.putObject({
        Bucket: process.env.BUCKET,
        Key: event.key,
        Body: "<h1>works</h1>",
      }).promise();
  //   ))
  //   .then(v => callback(null, v), callback);
};