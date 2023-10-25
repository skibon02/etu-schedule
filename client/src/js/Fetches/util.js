import process from 'process';

function isdev() {
    return !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
}

const simulateFetches = (function () {
    return !process.env.NODE_ENV || process.env.REACT_APP_SIMULATE_FETCHES === 'true';
})()

const backendHost = (() => {
    return isdev() ? window.location.protocol + "//" + window.location.hostname + ':5443' : window.location.origin;
})()

const currentHost = (() => {
    return window.location.origin
})()

export {isdev, simulateFetches, backendHost, currentHost}
