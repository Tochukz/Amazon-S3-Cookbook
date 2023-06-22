const { S3 } = require('aws-sdk');
const { param } = require('../routes');

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET, } = process.env;
const Prefix = 'S3App-uploads';

class FileService {
  s3 = null;

  constructor() {
    this.s3 = new S3({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      signatureVersion: 'v4',
      useAccelerateEndpoint: true, // enable transfer acceleration in the S3 bucket to use this
    });
  }

  /**
   * Setup parameters for the signed URL to be generated. 
   */
  getParams(updateParams = {}) {
    const params = {
      Bucket: S3_BUCKET,
      Expires: 5 * 60,
    };

    for(let prop in updateParams) {
        params[prop] = updateParams[prop];
    }
    return params;
  }

  /**
   * List all files in the bucket with a specific prefix
   */
  async listFiles() {
    return new Promise((resolve, reject) => {
      this.s3.listObjects({ Bucket: S3_BUCKET, Prefix }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          let files = []
          if (data.Contents) {
            const {Prefix, Contents} = data;
            const prefix = Prefix + '/'
            files = Contents.map(item => ({name: item.Key.replace(prefix, ''), lastModified: item.LastModified, size: item.Size}))           
          }
          resolve(files);
        }
      });
    });
  }

  /**
   * Generates signed URL to access a specific existing file
   */
  async getSignedUrl(name) {
    const Key = `${Prefix}/${name}`;
    const params = this.getParams({ Key });
    const signedUrl = await this.s3.getSignedUrlPromise('getObject', params);
    return { signedUrl };
  }

  /**
   * Generates signed URL to use a new file
   */
  async getPresignedUrl(Key, ContentType) {
    const params = this.getParams({Key, ContentType});
    const signedUrl = await this.s3.getSignedUrlPromise('putObject', params);
    return { signedUrl };
  }

  getFileExt(type) {
    let ext = '';
    if (type == 'application/pdf') {
      ext = 'pdf';
    } else if (type == 'text/csv') {
      ext = 'csv';
    } else if (type == 'image/jpeg') {
      ext = 'jpg';
    } else if (type == 'image/png') {
      ext = 'png';
    } else  {
      ext = 'zip'
    }
    return ext;
  }

  getKey(file) {
    const { name, type} = file;
    const ext = this.getFileExt(type);
    const nameOnly = name.substring(0, name.lastIndexOf('.'));
    return `${Prefix}/${nameOnly}.${ext}`
  }

  async getMultiPresingedUrl(files) {
    for(let file of files) {
      const key = this.getKey(file)
      const result = await this.getPresignedUrl(key, file.type);
      file.ext = this.getFileExt(file.type);;
      file.url = key;
      // Save filename to database
      file.signedUrl = result.signedUrl
    }
    return files;
  }

  async getMultipartUrls(key, uploadId, chunkLength) {
    const multipartParams = {
      Bucket: S3_BUCKET,
      Key: key,
      UploadId: uploadId,
      Expires: 10 * 60,
    }
    const promises = []
    for (let i = 0; i < chunkLength; i++) {
      promises.push(
        this.s3.getSignedUrlPromise("uploadPart", {
          ...multipartParams,
          PartNumber: i + 1,         
        }),
      )
    }
    const signedUrls = await Promise.all(promises);
    return signedUrls.map((signedUrl, i) => ({ signedUrl, partNumber: i + 1}));
  }

  async startMultipartUpload(file) {
    const key = this.getKey(file);
    const params = {
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: file.type,
      Expires: 10 * 60,
    }
    return new Promise((resolve, reject) => {
      this.s3.createMultipartUpload(params, (err, data) => {                
        if (err) {        
          reject(err);
        }        
        resolve(data);
      });
    });    
  }

  async completeLargeUpload(uploadId, file, parts) {
    const key = this.getKey(file);   
    const params = {
      Bucket: S3_BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { 
        Parts: parts
      }
    }
    return new Promise((resolve, reject)=> {
      this.s3.completeMultipartUpload(params, (err, data) => {
        if (err) {
          reject(err);
        }   
        resolve(data);
      });
    })    
  }

  async deleteFile(fileName){
    const key = `${Prefix}/${fileName}`
    const params = this.getParams({ Key: key });
    delete params.Expires;
    return new Promise((resolve, reject) => {
      this.s3.deleteObject(params, (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      })
    });
  }
}

module.exports = FileService;