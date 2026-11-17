declare module 'serverless-http' {
  import type { Application } from 'express';

  type ServerlessHandler = (
    event: unknown,
    context: unknown,
  ) => Promise<{
    statusCode: number;
    body?: string;
    headers?: Record<string, string | string[] | undefined>;
    isBase64Encoded?: boolean;
  }>;

  interface ServerlessOptions {
    binary?: string[] | boolean;
  }

  export default function serverless(
    app: Application,
    options?: ServerlessOptions,
  ): ServerlessHandler;
}
