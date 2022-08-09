// jshint esversion: 8

const AWS = require('aws-sdk');
const s3 = new AWS.S3();

module.exports.getObjectV1 = function(bucket, objectKey) {
// S3_BUCKET="$BUCKET" node -e 'let res=require("./s3.js").getObjectV1(process.env.S3_BUCKET, "app/input.txt", {}); console.log(res)'
// Retrieve the object
    let response = {};
    let s3FilePath = objectKey.replace(/^\/+/g, '');
    console.log(`getObjectV1: ${bucket}/${s3FilePath}`);
    const params = {
        Bucket: bucket,
        Key: objectKey
    };
    response = s3.getObject(params).promise().then(res => {
        console.log(`getObjectV1 : ${bucket}/${s3FilePath} : ok`);
        //console.log(res.Body.toString('utf-8'));
        require("./base.js").writeFileV1(`/tmp/${s3FilePath}`, res.Body.toString('utf-8'), 'w' );
        return res;
    }).catch(err => {
        console.log(`getObjectV1: ${bucket}/${s3FilePath} : failed`, err);
        response.status = "fail";
        return err;
    });
    return response;
};

module.exports.putObjectV1 = function(bucket, objectKey, data, response={}) {
//  recursive create userDirectory
//  S3_BUCKET="$BUCKET" node -e 'let res=require("./s3.js").putObjectV1(process.env.S3_BUCKET, s3FilePath, response); console.log(res)'
    let s3FilePath = objectKey.replace(/^\/+/g, '');
    s3.putObject({
        Bucket: bucket,
        Body: data,
        Key: s3FilePath
       }).promise().then(res => {
         console.log(`putObject: ${bucket}/${s3FilePath} : ok`);
         response.status = "ok";
         response.res=res;
         return response;
        }).catch(err => {
         console.log(`putObject : ${bucket}/${s3FilePath} : failed`, err);
         response.status = "fail";
         response.err=err;
         return response;
    });
};
