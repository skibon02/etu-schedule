import { backendHost } from './util';

async function myfetch(path: string, param: RequestInit = {}): Promise<Response> {
  path = backendHost + path;
  console.log('dev fetch to ' + path);
  param.credentials = 'include';

  if (navigator.onLine) {
    try {
      const response = await fetch(path, param);
      if (!response.ok) {
        throw new Error('fish!');
      }
      return response;
    } catch (error) {
      const e = error as Error;
      console.log('fish!');
      const event = new CustomEvent('fish', { detail: e.message });
      window.dispatchEvent(event);
      throw e; 
    }
  } else {
    return new Response(null, { status: 503, statusText: 'Offline' });
  }
}

export default myfetch;
