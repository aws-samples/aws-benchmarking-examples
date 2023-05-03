### **Instructions**

For this particular load testing, we will be utilizing the k6 benchmarking framework to perform a variety of benchmarking scenarios.

**Considerations**

1. Size of your benchmarking instance: The instance sizing would differ depending on the TPS requirements of your load testing. For example, I was able to run 1000TPS load tests from a c5.4xlarge, but not from my personal laptop. 
2. Networking: Running the benchmark from your personal laptop would give different results from running the benchmark from an EC2 instance. Ensure you are making apples to apples comparisons when analyzing your results.
3. Traffic profile: Most common production traffic profiles include ramping and spiking traffic. Load tests should be representative of the expected traffic shape to show all potential bottlenecks and improvement opportunities.

**Example 1: Basic HTTP load testing**

1. Install k6. Consult [k6 documentation](https://k6.io/docs/get-started/installation/) on how to do this.
2. Review the benchmarking config script: example1/config.js. Ensure you review and change the following variables accordingly:
    * APPSYNC_API_URL - Appsync endpoint.
    * scenarios - set the load characteristics.
    * summaryTrendStats - set the statistics you are interested in recording.
    * headers - set the headers that will be required to access your endpoint. In this case it could be an Authorization header or X-API-KEY header. The AUTH_KEY is set here for the Authorization header.
    * query - set your GraphQL query.
3. Run the benchmark:

```
k6 run ./config.js
```

**Example 2: Custom metrics**

Beyond the basic HTTP load testing shown above, there was a need to benchmark a situation where we make 2 HTTP calls in a particular user session and only record the faster of the two calls.  

1. Review the benchmarking script: example2/config.js. Ensure you change the variables mentioned in Example 1 before starting. The following changes are made to the base benchmarking script:

  * Create a Trend called myDuration. A Trend in k6 is a custom metric that can be utilized to only record metrics based on logic you specify.

```
import {check, sleep} from "k6";
import { Trend } from 'k6/metrics';

const myTrend = new Trend('myDuration');
```

  * Adding a second HTTP call.

```
const res = http.post(url, JSON.stringify({ query}), params);
const res2 = http.post(url, JSON.stringify({ query}), params);
```

  * The logic to only record the faster of the 2 calls to the Trend created earlier.

```
const res2 = http.post(url, JSON.stringify({ query}), params);

if(res.timings.duration > res2.timings.duration) {
    myTrend.add(res2.timings.duration);
} else {
    myTrend.add(res.timings.duration);
}
```

2. Run the benchmark and review the results:

```
k6 run ./config.js
...
`myDuration``.................:`` avg``=``6.45s`` p``(``90``)=``9.29s`` p``(``95``)=``9.32s`` p(99)=10.22s`
```

**Example 3: Benchmarking AWS services**

During our benchmarking, we noticed that the majority of latency was coming from AWS Lambda resolver calls inside AWS AppSync. In order to investigate the Lambda invokes, we setup an environment to mimic how AppSync calls Lambda. We can utilize k6 to perform the load testing but would need to augment k6 with the ability to sign HTTP requests with AWSsigv4 in order to authenticate with Lambda. 

k6 has a [standard library](https://github.com/grafana/k6-jslib-aws) for making AWSsigv4 calls to various services. But at the time of this writing, it did not work for Lambda. So I will be providing code to load test Lambda calls.

1. Two JavaScript files are added to perform the AWSsigv4 signing. You can review the two scripts:
  * example3/core.js
  * example3/headers.js
2. Review the benchmarking script: example3/config.js. Ensure you change the variables mentioned in Example 1 before starting. The following changes are made to the base benchmarking script:

  * Adding the signWithHeaders function  to our script.

```
import {check, sleep} from "k6";
import { signWithHeaders } from "./headers.js";
```

  * Create a signWithHeaders obj to get the AWSsigv4 signature. Ensure you replace the lambda endpoint (i.e. lambda.us-east-1.amazonaws.com) with your endpoint and the <FUNCTIONARN> with your lambda function arn.

```
const obj = signWithHeaders("POST", "lambda","lambda.us-east-1.amazonaws.com", region, "", "/2015-03-31/functions/<FUNCTIONARN>/invocations", query, "", {
    "Content-Type": "application/x-amz-json-1.1"
});

const res = http.post("https://lambda.us-east-1.amazonaws.com/2015-03-31/functions/<FUNCTIONARN>/invocations", JSON.stringify({ query}), { headers: obj.headers });
```

3. Run the benchmark.

```
k6 run ./config.js
```

