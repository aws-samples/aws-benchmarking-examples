import http from "k6/http";
import {check, sleep} from "k6";
import { signWithHeaders } from "./headers.js";

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

export default function () {
    const query = "";

    const obj = signWithHeaders("POST", "lambda","lambda.us-east-1.amazonaws.com", region, "", "/2015-03-31/functions/<FUNCTIONARN>/invocations", query, "", {
      "Content-Type": "application/x-amz-json-1.1"
    });
    
    const res = http.post("https://lambda.us-east-1.amazonaws.com/2015-03-31/functions/<FUNCTIONARN>/invocations", JSON.stringify({query}), { headers: obj.headers });
    
    check(res, {
        "response code was 2XX": (res) => res.status >= 200 && res.status < 300,
        "response code was not 4XX": (res) => res.status < 400 || res.status >= 500,
        "response code was not 5XX": (res) => res.status < 500,
        "response code doesn't have errors": (res) => !res.json().errors,
        "response code has data field": (res) => res.json().data != null,
    });
    sleep(1);
}