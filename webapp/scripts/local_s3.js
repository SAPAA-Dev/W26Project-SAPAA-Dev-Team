/* eslint-disable @typescript-eslint/no-require-imports -- CJS dev script loaded with require() */
const { readdirSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { S3Client, CreateBucketCommand, PutBucketCorsCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { ensureDocker, runCommand } = require('./local_deps');

// Not s3.localhost.localstack.cloud: some networks block or proxy DNS answers
// that point at loopback, and the browser fetches these URLs directly. The SDK
// uses path-style addressing for an IP endpoint.
const LOCAL_ENDPOINT = 'http://127.0.0.1:4566';
// LocalStack 3.x needs no account; the 4.x "lstk" CLI asks for a login.
const LOCALSTACK_IMAGE = 'localstack/localstack:3';
const CONTAINER_NAME = 'sapaa-localstack';
const HEALTH_URL = 'http://127.0.0.1:4566/_localstack/health';
const READY_TIMEOUT_MS = 180000;
const READY_POLL_MS = 5000;

function sleepSync(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function isContainerRunning() {
  try {
    const output = runCommand(
      'docker',
      ['ps', '--filter', `name=^/${CONTAINER_NAME}$`, '--format', '{{.Names}}'],
      { encoding: 'utf8' }
    );
    return output.trim() === CONTAINER_NAME;
  } catch {
    return false;
  }
}

async function isLocalstackReady() {
  try {
    const response = await fetch(HEALTH_URL);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForLocalstack() {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await isLocalstackReady()) {
      return;
    }
    sleepSync(READY_POLL_MS);
  }
  console.error(
    `LocalStack did not answer on ${HEALTH_URL}. Check \`docker logs ${CONTAINER_NAME}\`, then \`docker rm -f ${CONTAINER_NAME}\` and run npm run dev again.`
  );
  process.exit(1);
}

function ensureContainer() {
  ensureDocker();
  if (isContainerRunning()) {
    return;
  }
  try {
    runCommand('docker', ['rm', CONTAINER_NAME], { stdio: 'ignore' });
  } catch {
    // No container holds the name.
  }
  console.log(`Starting LocalStack ${LOCALSTACK_IMAGE} for local S3. Docker pulls the image on the first run.`);
  try {
    runCommand(
      'docker',
      // Not loopback only: a port forward from the host enters through the
      // sandbox network interface. LocalStack has no auth, so this publish is
      // for a sandbox network only.
      ['run', '-d', '--name', CONTAINER_NAME, '-p', '4566:4566', LOCALSTACK_IMAGE],
      { stdio: 'inherit' }
    );
  } catch (error) {
    console.error(error.message);
    console.error(`Could not start LocalStack. Is Docker running? Check \`docker logs ${CONTAINER_NAME}\`.`);
    process.exit(error.status || 1);
  }
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
  ensureContainer();
  await waitForLocalstack();
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

  // Without AWS_REGION the webapp routes cannot sign and silently drop every
  // image, so fill the missing values. Shell values keep priority, except the
  // endpoint, which must stay on LocalStack during npm run dev.
  const localEnv = { AWS_ENDPOINT_URL_S3: LOCAL_ENDPOINT };
  if (!process.env.AWS_REGION) {
    localEnv.AWS_REGION = 'us-east-1';
  }
  if (!process.env.AWS_ACCESS_KEY_ID) {
    localEnv.AWS_ACCESS_KEY_ID = 'test';
  }
  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    localEnv.AWS_SECRET_ACCESS_KEY = 'test';
  }
  if (!process.env.AWS_S3_BUCKET_NAME) {
    localEnv.AWS_S3_BUCKET_NAME = bucket;
  }
  return localEnv;
}

module.exports = { ensureLocalS3 };
