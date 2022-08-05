const AWS = require('aws-sdk');
require('dotenv').config();

const red = "\x1b[31m", green = "\x1b[32m";

const { appVersion, region, bucketName} = process.env;
new AWS.S3({appVersion, region})
       .deleteObject({ Bucket: bucketName, Key: 'places.txt'}, (err, data) => {
          if (err) {
            console.log(red, 'deleteObject', err.message);
          } else {
            console.log(green, 'Object deleted', data.VersionId);
            deleteBucket();
          }
       });

function deleteBucket() {
  new AWS.S3({appVersion, region})
         .deleteBucket({ Bucket: bucketName}, (err, data) => {
             if (err) {
                console.log(red, 'deleteBucket', err.message);
             } else {
                console.log(green, 'Bucket Deleted!');
             }
         })
}