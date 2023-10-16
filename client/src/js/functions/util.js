import process from 'process';

function isdev() {
    return !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
}

function simulateFetches() {
    return !process.env.NODE_ENV || process.env.SIMULATE_FETCHES === 'true';
}

export {isdev, simulateFetches}
