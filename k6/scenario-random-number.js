import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    vus: 0,
    stages: [
        { duration: '5s', target: 10 },
        { duration: '5s', target: 100 },
        { duration: '5s', target: 0 }
    ]
};

export default function() {
    if (!__ENV.APP_BASE_ADDRESS)
        throw new Error("Environment variable 'APP_BASE_ADDRESS' is not set");

    http.get(__ENV.APP_BASE_ADDRESS + "/api/random/number");
    sleep(1);
}

export async function handleSummary(data) {
    if (!__ENV.PUSHGATEWAY_BASE_ADDRESS)
        throw new Error("Environment variable 'PUSHGATEWAY_BASE_ADDRESS' is not set");

    const jobName = __ENV.JOB_NAME || "k6_lt";
    const scenario = "random-number";

    const metrics = [
        ...createHttpReqDurationMetrics(scenario, data.metrics.http_req_duration.values),
        ...createHttpReqsMetrics(scenario, data.metrics.http_reqs.values),
        ...createHttpReqFailedMetrics(scenario, data.metrics.http_req_failed.values)
    ];

    const url = `${__ENV.PUSHGATEWAY_BASE_ADDRESS}/metrics/job/${jobName}`;
    for (const metric of metrics) {
        const metricHeader = `# TYPE ${metric.name} ${metric.type}`;
        const metricData = createMetricData(
            metric.name,
            metric.labels,
            metric.value
        );

        try {
            const request = {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: `${metricHeader}\n${metricData}`
            };

            const response = await fetch(url, request);

            if (response.ok) {
                console.log(`Metric '${metric.name}' successfully pushed`);
            } else {
                console.error('Failed to push the metric', response.statusText);
            }
        } catch (error) {
            console.error(`Error sending metric ${metric.name}`);
        }
    }
}

function createHttpReqDurationMetrics(scenario, values) {

    const metricName = "k6_http_req_duration";
    const metricType = "gauge";
    
    const metricNameLabel = "http_req_duration";

    return [
        {
            name: metricName,
            type: metricType,
            labels: {
                scenario: scenario,
                name: metricNameLabel,
                type: "avg"
            },
            value: values["avg"]
        },
        {
            name: metricName,
            type: metricType,
            labels: {
                scenario: scenario,
                name: metricNameLabel,
                type: "med"
            },
            value: values["med"]
        },
        {
            name: metricName,
            type: metricType,
            labels: {
                scenario: scenario,
                name: metricNameLabel,
                type: "p90"
            },
            value: values["p(90)"]
        },
        {
            name: metricName,
            type: metricType,
            labels: {
                scenario: scenario,
                name: metricNameLabel,
                type: "p95"
            },
            value: values["p(95)"]
        }
    ];
}

function createHttpReqsMetrics(scenario, values) {

    const metricName = "k6_http_reqs";
    const metricType = "gauge";

    const metricNameLabel = "http_reqs";

    return [
        {
            name: metricName,
            type: metricType,
            labels: {
                scenario: scenario,
                name: metricNameLabel,
                type: "count"
            },
            value: values["count"]
        },
        {
            name: metricName,
            type: metricType,
            labels: {
                scenario: scenario,
                name: metricNameLabel,
                type: "rate"
            },
            value: values["rate"]
        }
    ];
}

function createHttpReqFailedMetrics(scenario, values) {

    const metricName = "k6_http_req_failed";
    const metricType = "gauge";

    const metricNameLabel = "http_req_failed";

    return [
        {
            name: metricName,
            type: metricType,
            labels: {
                scenario: scenario,
                name: metricNameLabel,
                type: "rate"
            },
            value: values["rate"]
        }
    ];
}

function createMetricData(metricsName, metricsLabels, metricsValue) {
    const formattedMetricsLabels = Object
        .entries(metricsLabels)
        .map(([key, value]) => `${key}="${value}"`)
        .join(',');

    return `${metricsName}{${formattedMetricsLabels}} ${metricsValue}`;
}
