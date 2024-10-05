import glob
import json
import os
import urllib.request
import urllib.error

def read_metrics():
    result = []

    directory = "report"
    pattern = "*.report.json"
    file_paths = glob.glob(f"{directory}/{pattern}")
    for file_path in file_paths:
        try:
            scenario = file_path[len(directory) + 1:-(len(pattern) - 1)]
            with open(file_path, "r", encoding="utf-8") as file:
                json_obj = json.load(file)
                json_obj["scenario"] = scenario

                result.append(json_obj)
        except json.JSONDecodeError:
            print(f"Something went wrong when reading the file '{file_path}'")

    return result

def process_http_req_duration_values(scenario, values):
    METRIC_NAME = "k6_http_req_duration"
    METRIC_TYPE = "gauge"

    return {
        "name": METRIC_NAME,
        "type": METRIC_TYPE,
        "data": [
            {
                "labels": {
                    "scenario": scenario,
                    "type": "avg"
                },
                "value": values["avg"]
            },
            {
                "labels": {
                    "scenario": scenario,
                    "type": "med"
                },
                "value": values["med"]
            },
            {
                "labels": {
                    "scenario": scenario,
                    "type": "p90"
                },
                "value": values["p(90)"]
            },
            {
                "labels": {
                    "scenario": scenario,
                    "type": "p95"
                },
                "value": values["p(95)"]
            }
        ]
    }

def process_http_reqs_values(scenario, values):
    METRIC_NAME = "k6_http_reqs"
    METRIC_TYPE = "gauge"

    return {
        "name": METRIC_NAME,
        "type": METRIC_TYPE,
        "data": [
            {
                "labels": {
                    "scenario": scenario,
                    "type": "count"
                },
                "value": values["count"]
            },
            {
                "labels": {
                    "scenario": scenario,
                    "type": "rate"
                },
                "value": values["rate"]
            }
        ]
    }

def process_http_req_failed_values(scenario, values):
    METRIC_NAME = "k6_http_req_failed"
    METRIC_TYPE = "gauge"

    return {
        "name": METRIC_NAME,
        "type": METRIC_TYPE,
        "data": [
            {
                "labels": {
                    "scenario": scenario,
                    "type": "rate"
                },
                "value": values["rate"]
            }
        ]
    }

def process_metrics(data):
    metrics = []
    for item in data:
        metrics.append(process_http_req_duration_values(item["scenario"], item["metrics"]["http_req_duration"]["values"]))
        metrics.append(process_http_reqs_values(item["scenario"], item["metrics"]["http_reqs"]["values"]))
        metrics.append(process_http_req_failed_values(item["scenario"], item["metrics"]["http_req_failed"]["values"]))

    groups = {}
    for metric in metrics:
        key = (metric["name"], metric["type"])
        groups.setdefault(key, []).append(metric)

    result = []
    for key, values in groups.items():

        formatted_header = f"# TYPE {key[0]} {key[1]}"
        result.append(formatted_header)

        for value in values:
            for value_item in value["data"]:
                formatted_metric_name = key[0]
                formatted_labels = ",".join(map(lambda item: f"{item[0]}=\"{item[1]}\"", value_item["labels"].items()))
                formatted_value = value_item["value"]

                formatted_metric = f"{formatted_metric_name}{{{formatted_labels}}} {formatted_value}"
                result.append(formatted_metric)

    result.append("")
    return result

def push_metrics(metrics):
    base_address = os.getenv("PUSHGATEWAY_BASE_ADDRESS", "http://localhost:9091")
    job = os.getenv("JOB_NAME", "k6")
    instance = os.getenv("INSTANCE_NAME")
    if not instance:
        return

    url = f"{base_address}/metrics/job/{job}/instance/{instance}"
    data = "\n".join(metrics).encode("utf-8")
    headers = {
        'Content-Type': 'text/plain'
    }

    request = urllib.request.Request(url, data, headers)
    try:
        with urllib.request.urlopen(request) as response:
            if response.status != 200:
                print(f"Failed to push metrics: {response.reason}")
    except urllib.error.URLError as e:
        print(f"Failed to push metrics: {e.reason}")

if __name__ == "__main__":
    metrics = read_metrics()
    processed_metrics = process_metrics(metrics)
    push_metrics(processed_metrics)