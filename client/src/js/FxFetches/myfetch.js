import {isdev, simulateFetches, backendHost} from './util'
import {groups_request_example, schedule_request_example} from './mock_data' 

async function myfetch(path, param = {}) {
    let initialPath = path;
    path = backendHost + path;
    if (isdev()) {
        console.log('dev fetch to ' + path)
        param.credentials = "include";
    }
    else {
        console.log('prod fetch to ' + path)
    }

    if (simulateFetches) {
        console.log('Using mock instead of real fetch...');
        return Promise.resolve({
            json: async () => {
                if (/\/api\/groups/.test(initialPath)) {
                    console.log ('returning groups list')
                    return groups_request_example;
                }
                if (/\/api\/scheduleObjs\/group\/\d+/.test(initialPath)) {
                    console.log('returning schedule for 0303')
                    return schedule_request_example;
                }
                if (initialPath === '/api/auth/check') {
                    console.log('returning mock for auth check');
                    return {is_authorized: false}
                }
                if (initialPath === '/api/auth/data') {
                    console.log('returning mock vkData');
                    return {
                        first_name: "Денис",
                        is_authorized: true,
                        last_name: "Шарпинский",
                        profile_photo_url: "https://images.dog.ceo/breeds/pinscher-miniature/n02107312_867.jpg"
                    }
                }
                console.log('Not found handler for mock request!')
            },
            ok: true,
            status: 200,
            statusText: "OK",
        });
    }
    else {
        return fetch(path, param);
    }
}
export default myfetch;
