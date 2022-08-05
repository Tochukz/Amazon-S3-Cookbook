const AWS  = require('aws-sdk');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const red = "\x1b[31m", green = "\x1b[32m";

/** Check to see if you credential is accessable  */
AWS.config.getCredentials((err, credentials) => {
  if (err) {
    console.log(red, 'getCredentials:', err.stask)
  } else {
    console.log(green, "Credentials aquired!", AWS.config.credentials.accessKeyId);
    console.log(credentials.accessKeyId);
    // To check if your region is set properly. region should be set in C:\Users\USER-NAME\.aws\config
    //console.log('My Region', AWS.config.region);
  }
});
/** Your credential should be defined in C:\Users\USER-NAME\.aws\credential for windows or ~/.aws/credential for UNIX */

const { region, apiVersion, bucketName }  = process.env; 
new AWS.S3({ apiVersion,  region })
        .createBucket({ Bucket: bucketName}, (err, data) => {
            if (err) {
                console.log(red, 'createBucket: ', err.message);
                if (err.message.indexOf('you already own it') > -1) {
                  // Bucket may already exist;
                  console.log(green, 'Bucket already exists');
                  addObjectToBucket();
                }
            } else {
                console.log(green, 'Bucket created at', data.Location);  
                addObjectToBucket();
            }
        });

function addObjectToBucket() {      
    const filename = 'places.txt';
    const body = fs.readFileSync(path.resolve(__dirname, filename)); //.toString();
    const newObject = {Bucket: bucketName, Key: filename, Body: body};
    new AWS.S3({ apiVersion })
            .putObject(newObject, (err, data) => {
                if (err) {
                    console.log(red, 'putObject:', err.message);
                } else {
                    console.log(green, "places.txt object was uploaded!", data.VersionId);
                }
            });
}