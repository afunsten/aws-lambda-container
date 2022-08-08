// jshint esversion: 8

const AWS = require('aws-sdk');
const s3 = new AWS.S3();

module.exports.putObject = function(process, event, data, response={}) {
    //  recursive create userDirectory
    //  BUCKET="$BUCKET" node -e 'let event={}; let response={}; let res=require("./s3.js").putObject(event, process, response); console.log(res)'
    let s3FilePath = event.s3FilePath.replace(/^\/+/g, '');
    s3.putObject({
        Bucket: process.env.BUCKET,
        Body: data,
        Key: s3FilePath
       })
        .promise()
        .then(res => {
         console.log(`putObject: ${process.env.BUCKET}/${s3FilePath} : ok`);
         response.status = "ok";
         response.res=res;
         return response;
        })
        .catch(err => {
         console.log(`putObject : ${process.env.BUCKET}/${s3FilePath} : failed`, err);
         response.status = "fail";
         response.err=err;
         return response;
    });
};