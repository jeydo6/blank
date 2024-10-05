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

    http.get(__ENV.APP_BASE_ADDRESS + "/api/random/number");
    sleep(1);
}

export function pushMetrics(url, metricGroups) {
    for (const metricGroup of metricGroups) {
        const bodyLines = [ `# TYPE ${metricGroup.name} ${metricGroup.type}` ];
        for (const metric of metricGroup.data) {
            const bodyLine = createMetricData(
                metricGroup.name,
                metric.labels,
                metric.value
            );

            bodyLines.push(bodyLine);
        }

        const headers = {
            'Content-Type': 'text/plain'
        };
        const body = bodyLines.join('\n') + '\n';

        const response = http.post(url, body, {
            headers: headers
        });

        if (response.status !== 200) {
            console.error('Failed to push metrics', response.statusText);
        }
    }
}

export function createMetrics(scenario, metrics) {
    return [
        createHttpReqDurationMetrics(scenario, metrics.http_req_duration.values),
        createHttpReqsMetrics(scenario, metrics.http_reqs.values),
        createHttpReqFailedMetrics(scenario, metrics.http_req_failed.values)
    ];
}

function createHttpReqDurationMetrics(scenario, values) {

    const metricName = "k6_http_req_duration";
    const metricType = "gauge";

    return {
        name: metricName,
        type: metricType,
        data: [
            {
                labels: {
                    scenario: scenario,
                    type: "avg"
                },
                value: values["avg"]
            },
            {
                labels: {
                    scenario: scenario,
                    type: "med"
                },
                value: values["med"]
            },
            {
                labels: {
                    scenario: scenario,
                    type: "p90"
                },
                value: values["p(90)"]
            },
            {
                labels: {
                    scenario: scenario,
                    type: "p95"
                },
                value: values["p(95)"]
            }
        ]
    };
}

function createHttpReqsMetrics(scenario, values) {

    const metricName = "k6_http_reqs";
    const metricType = "gauge";

    const metricNameLabel = "http_reqs";

    return {
        name: metricName,
        type: metricType,
        data: [
            {
                labels: {
                    scenario: scenario,
                    type: "count"
                },
                value: values["count"]
            },
            {
                labels: {
                    scenario: scenario,
                    type: "rate"
                },
                value: values["rate"]
            }
        ]
    };
}

function createHttpReqFailedMetrics(scenario, values) {

    const metricName = "k6_http_req_failed";
    const metricType = "gauge";

    return {
        name: metricName,
        type: metricType,
        data: [
            {
                labels: {
                    scenario: scenario,
                    type: "rate"
                },
                value: values["rate"]
            }
        ]
    };
}

function createMetricData(metricsName, metricsLabels, metricsValue) {
    const formattedMetricsLabels = Object
        .entries(metricsLabels)
        .map(([key, value]) => `${key}="${value}"`)
        .join(',');

    return `${metricsName}{${formattedMetricsLabels}} ${metricsValue}`;
}
