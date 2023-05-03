import http from "k6/http";
import {check, sleep} from "k6";
import { Trend } from 'k6/metrics';

const myTrend = new Trend('myDuration');

export let options = {
    insecureSkipTLSVerify: true, //Disable SSL certificate verification
    scenarios: {
        contacts: {
            executor: "ramping-vus",
            startVUs: 10,
            stages: [
                {duration: "10m", target: 100}, // config would have k6 ramping up from 10 to 100 VUs for 10 min,
                {duration: "10m", target: 100},
                {duration: "10m", target: 10},
            ],
        },
    },
    thresholds: {
        http_req_failed: ["rate<0.01"], // http errors should be less than 1%
        http_req_duration: ["p(95)<500"], // 95% of requests should be below 500ms
    },
    summaryTrendStats: [
        "avg",
        "p(90)",
        "p(95)",
        "p(99)",
        "count",
    ],
    noVUConnectionReuse: true,
};

const url = "<APPSYNC_API_URL>";

export default function () {
    const params = {
        headers: {
            "Content-type": "application/json",
            "Authorization": "<AUTH_KEY>",
        },
    };
    const query = `
        query data {
            human(id: "1000") {
                name
                height
            }
        }
    `;
    const res = http.post(url, JSON.stringify({ query}), params);
    const res2 = http.post(url, JSON.stringify({ query}), params);

    if(res.timings.duration > res2.timings.duration) {
      myTrend.add(res2.timings.duration);
    } else {
      myTrend.add(res.timings.duration);
    }
    
    check(res, {
        "response code was 2XX": (res) => res.status >= 200 && res.status < 300,
        "response code was not 4XX": (res) => res.status < 400 || res.status >= 500,
        "response code was not 5XX": (res) => res.status < 500,
        "response code doesn't have errors": (res) => !res.json().errors,
        "response code has data field": (res) => res.json().data != null,
    });
    sleep(1);
}