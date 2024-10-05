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

export default function() {
    if (!__ENV.APP_BASE_ADDRESS)
        throw new Error("Environment variable 'APP_BASE_ADDRESS' is not set");

    http.get(__ENV.APP_BASE_ADDRESS + "/api/random/delay");
    sleep(1);
}

export function handleSummary(data) {
    const scenario = "random-delay";
    return {
        [`report/${scenario}.report.json`]: JSON.stringify(data)
    }
}
