import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    vus: 0,
    stages: [
        { duration: '5s', target: 10 },
        { duration: '50s', target: 100 },
        { duration: '5s', target: 0 }
    ]
};

const baseUrl = 'http://localhost:' + (__ENV.APP_PORT || '5290');

export default function() {
    http.get(baseUrl + '/api/random/number');
    sleep(1);
}
