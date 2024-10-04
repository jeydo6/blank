import http from 'k6/http';
import { sleep } from 'k6';
import { createMetrics, pushMetrics } from "./prometheus-ext.module";

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

    http.get(__ENV.APP_BASE_ADDRESS + "/api/random/number");
    sleep(1);
}

export function handleSummary(data) {
    if (!__ENV.PUSHGATEWAY_BASE_ADDRESS)
        throw new Error("Environment variable 'PUSHGATEWAY_BASE_ADDRESS' is not set");

    const scenario = "random-number";
    const jobName = __ENV.JOB_NAME || "k6_lt";
    const instanceName = __ENV.INSTANCE_NAME || "stg";

    const metrics = createMetrics(scenario, data.metrics);

    const url = `${__ENV.PUSHGATEWAY_BASE_ADDRESS}/metrics/job/${jobName}/instance/${instanceName}`;
    pushMetrics(url, metrics);
}
