const backendHost = (() => {
    return window.location.protocol + "//" + window.location.hostname + ':5443';
})()

const currentHost = (() => {
    return window.location.origin
})()

export {backendHost, currentHost}
