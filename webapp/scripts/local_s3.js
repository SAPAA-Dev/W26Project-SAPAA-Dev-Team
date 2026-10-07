/* eslint-disable @typescript-eslint/no-require-imports -- CJS dev script loaded with require() */
const { execFileSync } = require('node:child_process');
const { existsSync, readdirSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { S3Client, CreateBucketCommand, PutBucketCorsCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

// LocalStack only accepts virtual-hosted-style S3 requests when the host
// starts with "s3." (https://docs.localstack.cloud/aws/services/s3/).
const LOCAL_ENDPOINT = 'http://s3.localhost.localstack.cloud:4566';
const READY_TIMEOUT_MS = 180000;
const READY_POLL_MS = 5000;

function findLstkCli() {
  const found = (process.env.PATH || '')
    .split(path.delimiter)
    .map((directory) => path.join(directory, 'lstk'))
    .find((candidate) => existsSync(candidate));
  if (found) {
    return found;
  }
  console.error(
    'The lstk CLI is required for local S3. Install it (see https://docs.localstack.cloud), ' +
    'then run `lstk login` once.'
  );
  process.exit(1);
}

function isRunning(cli) {
  try {
    const output = execFileSync(cli, ['status', '--json'], { encoding: 'utf8' });
    const status = JSON.parse(output);
    return (status.data?.emulators ?? []).some((emulator) => emulator.running);
  } catch {
    return false;
  }
}

function ensureContainer(cli) {
  if (isRunning(cli)) {
    return;
  }
  console.log('Starting LocalStack for local S3...');
  try {
    execFileSync(cli, ['start', '--non-interactive'], { stdio: 'inherit' });
  } catch (error) {
    console.error('Could not start LocalStack. Is Docker running, and are you logged in (`lstk login`)?');
    process.exit(error.status || 1);
  }
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (isRunning(cli)) {
      return;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, READY_POLL_MS);
  }
  console.error('LocalStack did not become ready. Check `lstk logs`.');
  process.exit(1);
}

async function ensureBucket(client, bucket) {
  try {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  } catch (error) {
    if (error.name !== 'BucketAlreadyOwnedByYou' && error.name !== 'BucketAlreadyExists') {
      throw error;
    }
  }
  await client.send(new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [{
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'HEAD', 'DELETE'],
        AllowedOrigins: ['*'],
      }],
    },
  }));
}

async function uploadSeedImages(client, bucket, webappDir) {
  const assetsDir = path.join(webappDir, '__tests__', 'assets');
  const files = readdirSync(assetsDir).filter((name) => name.endsWith('.jpg')).sort();
  for (const name of files) {
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: `seed/ducks/${name}`,
      Body: readFileSync(path.join(assetsDir, name)),
      ContentType: 'image/jpeg',
    }));
  }
  console.log(`Uploaded ${files.length} seed images to local bucket ${bucket}.`);
}

async function ensureLocalS3(webappDir) {
  const cli = findLstkCli();
  ensureContainer(cli);
  const bucket = process.env.AWS_S3_BUCKET_NAME || 'sapaa-inspection-images';
  const client = new S3Client({
    region: 'us-east-1',
    endpoint: LOCAL_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    },
  });
  await ensureBucket(client, bucket);
  await uploadSeedImages(client, bucket, webappDir);
  return { AWS_ENDPOINT_URL_S3: LOCAL_ENDPOINT };
}

module.exports = { ensureLocalS3 };
