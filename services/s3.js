const AWS = require('aws-sdk');

// Configure AWS credentials and region from environment variables
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Upload file to S3
exports.uploadToS3 = async (buffer, key, mimetype) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  };
  const data = await s3.upload(params).promise();
  return data.Location; // S3 URL
};

// Download file from S3
exports.getFromS3 = async (key) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };
  const data = await s3.getObject(params).promise();
  return data.Body; // Buffer
};
