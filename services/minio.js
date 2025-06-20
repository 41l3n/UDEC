const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});

// Create bucket if not exists
minioClient.bucketExists(process.env.MINIO_BUCKET, (err, exists) => {
  if (err) throw err;
  if (!exists) {
    minioClient.makeBucket(process.env.MINIO_BUCKET, (err) => {
      if (err) throw err;
      console.log(`Created bucket: ${process.env.MINIO_BUCKET}`);
    });
  }
});

module.exports = minioClient;