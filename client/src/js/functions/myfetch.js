import {isdev} from './util'
async function myfetch(path, param = {}) {
    if (isdev()) {
        path = 'https://localhost:5443' + path;
        console.log('dev fetch to ' + path)
        return fetch( path, param);
    }
    else {
        console.log('prod fetch to ' + path)
        return fetch(path, param);
    }
}
export default myfetch;
