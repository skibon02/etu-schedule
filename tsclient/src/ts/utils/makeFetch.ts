import myfetch from "./myfetch";

export async function makeFetch(url: string, params: RequestInit = {}, onSuccess: Function, onFail: Function, fishMessage: string) {
  try {
    const r = await myfetch(url, params, fishMessage);
    if (r.status === 200) {
      const d = await r.json();
      console.log(`successfully fetched on ${url}\nresponse:`, d);
      onSuccess(d, r);
    } else {
      onFail(r);
      throw new Error(`${r.status}`);
    }
  } catch (error) {
    const e = error as Error;
    console.error(`Failed to fetch on ${url}\nresponse status: ${e.message}`);
  }
}
