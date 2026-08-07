import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ru-1',
  endpoint: process.env.S3_ENDPOINT || 'https://s3.twcstorage.ru',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: true, // Важно для S3 Timeweb
});

/**
 * Загрузка файла в S3
 * @param {Buffer} fileBuffer — буфер файла
 * @param {string} fileName — имя файла
 * @param {string} mimeType — тип файла (application/pdf, image/jpeg)
 * @returns {Promise<string>} — публичная ссылка на файл
 */
export async function uploadToS3(fileBuffer, fileName, mimeType) {
  const bucketName = process.env.S3_BUCKET_NAME;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  // Формируем прямую ссылку на файл
  return `${process.env.S3_ENDPOINT}/${bucketName}/${fileName}`;
}
