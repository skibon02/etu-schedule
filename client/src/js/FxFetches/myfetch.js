import {backendHost} from './util'

async function myfetch(path, param = {}) {
    path = backendHost + path;
    console.log('dev fetch to ' + path)
    param.credentials = "include";
    if (navigator.onLine) {
        let result = fetch(path, param).
        then(r => {
            if (!r.ok) {
                throw new Error('fish!')
            }
            return r;
        }).
        catch(e => {
            console.log('fish!');
            const event = new CustomEvent('fish', { detail: e.message });
            window.dispatchEvent(event);
        })
        return result
    } else {
        return {
            json: () => ({ ok: false })
        };
    }
}
export default myfetch;
