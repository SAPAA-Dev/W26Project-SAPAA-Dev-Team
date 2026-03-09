import '@testing-library/jest-dom';
import 'whatwg-fetch';

process.env.AWS_REGION = "ca-central-1";
process.env.AWS_S3_BUCKET_NAME = "test-bucket";
process.env.AWS_ACCESS_KEY_ID = "test-key";
process.env.AWS_SECRET_ACCESS_KEY = "test-secret";