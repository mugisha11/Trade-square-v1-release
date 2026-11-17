import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import serverless from 'serverless-http';
import { createApp } from '../../server';

type ServerlessHandler = (
  event: HandlerEvent,
  context: unknown,
) => Promise<HandlerResponse>;

let cached: ServerlessHandler | null = null;

function rewriteApiPath(event: HandlerEvent): HandlerEvent {
  const rawPath = event.path || '/';
  let path = rawPath;
  if (path.startsWith('/.netlify/functions/api')) {
    path = path.replace('/.netlify/functions/api', '') || '/';
  }
  if (!path.startsWith('/api')) {
    path = `/api${path.startsWith('/') ? path : `/${path}`}`;
  }
  return { ...event, path };
}

async function getServerlessHandler(): Promise<ServerlessHandler> {
  if (cached) return cached;
  const app = await createApp({ serveFrontend: false });
  cached = serverless(app, {
    binary: ['image/*', 'application/pdf', 'application/octet-stream'],
  }) as ServerlessHandler;
  return cached;
}

export const handler: Handler = async (event, context) => {
  const run = await getServerlessHandler();
  return run(rewriteApiPath(event), context);
};
