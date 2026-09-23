import {onRequest as requireOwner} from './functions/_middleware.js';
import {onRequestGet, onRequestPut} from './functions/api/state.js';

// Worker deployment for cronogramadiario.workers.dev.
// All requests, including static assets, pass through the Access JWT check.
export default {
  async fetch(request, env) {
    return requireOwner({
      request,
      env,
      next: async () => {
        const path = new URL(request.url).pathname;
        if (path === '/api/state') {
          if (request.method === 'GET') return onRequestGet({request, env});
          if (request.method === 'PUT') return onRequestPut({request, env});
          return new Response('Método não permitido.', {status: 405, headers: {Allow: 'GET, PUT'}});
        }
        if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Método não permitido.', {status: 405});
        return env.ASSETS.fetch(request);
      }
    });
  }
};
