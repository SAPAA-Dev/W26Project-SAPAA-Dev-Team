// Jest mock for @aws-sdk/client-s3, which Jest cannot parse in production form.
export const mockSend = jest.fn();

export const S3Client = jest.fn().mockImplementation(() => ({
  send: mockSend,
}));

export const PutObjectCommand = jest.fn().mockImplementation((input: unknown) => ({ input }));

export const GetObjectCommand = jest.fn().mockImplementation((input: unknown) => ({ input }));

export const DeleteObjectsCommand = jest.fn().mockImplementation((input: unknown) => ({ input }));
