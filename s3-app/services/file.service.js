const { S3 } = require('aws-sdk');
const { param } = require('../routes');

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET, } = process.env;
class FileService {
  s3 = null;

  constructor() {
    this.s3 = new S3({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      signatureVersion: 'v4',
    });
  }

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

  async listFiles(Prefix) {
    const params = this.getParams();
    return new Promise((resolve, reject) => {
      this.s3.listObjects({ Bucket: S3_BUCKET, Prefix }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async getSignedUrl(Key) {
    const params = this.getParams({ Key });
    const signedUrl = await this.s3.getSignedUrlPromise('getObject', params);
    return { signedUrl };
  }

  async getPresignedUrl(Key, ContentType) {
    const params = this.getParams({Key, ContentType});
    const signedUrl = await this.s3.getSignedUrlPromise('putObject', params);
    return { signedUrl };
  }

  getFileExt(type) {
    let ext = '';
    if (file.type == 'application/pdf') {
      ext = 'pdf';
    } else if (type == 'text/csv') {
      ext = 'csv';
    } else if (type == 'image/jpeg') {
      ext = 'jpg';
    } else if (type == 'image/png') {
      ext = 'png';
    }
    return ext;
  }

  async getMultiPresingedUrl(files, prefix) {
    for(let file in files) {
      const ext = getFileExt(file.type);
      const key = `${prefix}/${file.name}.${ext}`;
      const result = await this.getPresignedUrl(key, file.type);
      file.ext = ext;
      file.url = key;
      // Save filename to database
      file.signedUrl = result.signedUrl
    }
    return files;
  }
}

module.exports = FileService;