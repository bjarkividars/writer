import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION;
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

function getS3Client() {
  if (!REGION || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    throw new Error("Missing AWS S3 configuration.");
  }

  return new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (!body) {
    throw new Error("Missing S3 object body.");
  }

  if (Buffer.isBuffer(body)) {
    return body;
  }

  if (typeof body === "string") {
    return Buffer.from(body);
  }

  if (typeof (body as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === "function") {
    const arrayBuffer = await (body as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  const chunks: Buffer[] = [];
  const stream = body as AsyncIterable<Uint8Array>;

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

export async function getObjectBase64(input: {
  bucket: string;
  key: string;
  maxBytes: number;
}): Promise<string> {
  const client = getS3Client();
  const response = await client.send(
    new GetObjectCommand({ Bucket: input.bucket, Key: input.key })
  );

  const buffer = await streamToBuffer(response.Body);
  if (buffer.length > input.maxBytes) {
    throw new Error("S3 object exceeds size limit.");
  }

  return buffer.toString("base64");
}

export async function putObject(input: {
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    })
  );
}
