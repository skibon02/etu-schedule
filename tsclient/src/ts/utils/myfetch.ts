import { backendHost } from './util';

async function myfetch(path: string, param: RequestInit = {}): Promise<Response> {
  path = backendHost + path;
  console.log('dev fetch to ' + path);
  param.credentials = 'include';

  if (navigator.onLine) {
    try {
      const r = await fetch(path, param);
      if (!r.ok) {
        throw new Error('fish!');
      }
      return r;
    } catch (error) {
      const e = error as Error;
      console.log('fish!');
      const event = new CustomEvent('fish', { detail: e.message });
      window.dispatchEvent(event);
      throw e; 
    }
  } else {
    const responseBody = JSON.stringify({ message: "Error message" });
    const r = new Response(responseBody, { status: 400, statusText: 'Offline' });
    return r;
  }
}

export default myfetch;
