import process from 'process';

function isdev() {
    return !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
}

export {isdev}
