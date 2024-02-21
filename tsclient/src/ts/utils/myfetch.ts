import { backendHost } from './util';

async function myfetch(path: string, param: RequestInit = {}, fishMessage: string): Promise<Response> {
  path = backendHost + path;
  console.log('fetch to ' + path);
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
      const userDescription = `Кажется, произошла ошибка при попытке ${fishMessage}. Попробуйте перезагрузить страницу.`;
      const event = new CustomEvent('fish', { detail: userDescription });
      window.dispatchEvent(event);
      throw e; 
    }
  } else {
    const responseBody = JSON.stringify({ message: "Error message" });
    const r = new Response(responseBody, { status: 400, statusText: 'Offline' });
    const userDescription = `Похоже, что вы не в сети. Рекомендуем перезагрузить страницу.`;
    const event = new CustomEvent('fish', { detail: userDescription });
    window.dispatchEvent(event);
    return r;
  }
}

export default myfetch;
