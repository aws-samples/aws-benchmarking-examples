#### **Instructions**

For this particular load testing, we will be utilizing the artillery benchmarking framework to perform a variety of benchmarking scenarios.

**Considerations**

1. Size of your benchmarking instance: The instance sizing would differ depending on the TPS requirements of your load testing. For example, I was able to run 1000TPS load tests from a c5.4xlarge, but not from my personal laptop. 
2. Networking: Running the benchmark from your personal laptop would give different results from running the benchmark from an EC2 instance. Ensure you are making apples to apples comparisons when analyzing your results.
3. Traffic profile: Most common production traffic profiles include ramping and spiking traffic. Load tests should be representative of the expected traffic shape to show all potential bottlenecks and improvement opportunities. 
4. Queued queries: You should check the following Cloudwatch metric for Neptune: MainRequestQueuePendingRequests. This metric shows you the current number of queries in the query queue that sits in front of Neptune. If you send requests and all the workers are busy, the query lands in the query queue and waits to be served by the next available worker. If the value of that metric is > 0 during your load tests, your latency numbers may be skewed higher because it includes the time spent waiting in the queue in addition to the actual query execution time.

**Example 1: Basic HTTP load testing**

1. Install artillery. Consult [artillery documentation](https://www.artillery.io/docs/guides/getting-started/installing-artillery) on how to do this.
2. Review the config script in example1/config.yml. Ensure you review and change the following variables accordingly:
    * target - set your Neptune endpoint here.
    * phases - you can create different phases of the benchmark here.
        * duration - how long you want to run the benchmark for.
        * arrivalRate - the rate at which new virtual users (VU) are created. Each VU will run each scenario that you define.
        * name - name of the phase.
    * scenarios - you can create different scenarios that your VUs will run.
        * loop - run statements X number of times in a loop where count defines X.
          * post - make a post call to the target url with a json body.
          * json - json body of the call.
        * count - how many times the loop will run through.
3. You can use random numbers as query parameters to make the benchmarking more like the actual traffic.

```
{{$randomNumber(1,20)}} - utilize random numbers between 1 and 20.
```

4. Run the benchmark.

```
cd example1
artillery run ./config.yml
```

**Example 2: Custom Artillery extensions**

Artillery allows you to create custom extensions that run javascript code to create more complex scenarios. As an example I will showcase creating and utilizing a custom artillery extension to create random floating point numbers for making calls with random variables in the benchmark queries.


1. Review the benchmarking script example2/config.yml. Ensure you make the appropiate changes to the script similar to Example 1.
2. The custom extensions are defined in an external file named example2/functions.js. 
3. In order to load the custom extensions we modified the HTTP script to add a processor attribute:

```
processor: "./functions.js"
```

4. Then in the loop we call the function. Here the function getRandomFloat will run and set the variable called randomFloat which we can then reference in our HTTP call:

```
{{ randomFloat }}
```

5. Run the benchmark.

```
cd example2
artillery run ./config.yml
```

**Example3: Cached vs un-cached data**

One of the issues with testing a service like Amazon Neptune is getting results from cached and un-cached data. The differences in latency between the two can be quite different. For benchmarking performance on cached data, you can perform queries on a small set of data increasing the likelihood that you will be utilizing cached data. In order to benchmark un-cached data, you will need to introduce randomness in selecting data. This is simple if the data is sequentially named by utilizing random integers/floats. You can see Example 1 and Example 2 for how we utilize random integers/floats in our queries. But what if you had data ids like UIDs? Reading in a list of billions of UIDs and selecting a random UID is not scalable. A possible solution is to index the UIDs in a key value store like Amazon DynamoDB with an integer value as its key. Then generate a random integer and make a getItem on DynamoDB for the UID which can be used in the query for benchmarking.

1. Review the benchmarking script example3/config.yml. Ensure you make the appropiate changes to the script similar to Example 1. We will utilize a new function which will populate the randomNode variable.
```
{{ randomNode }}
```
2. Similar to Example 2, we will utilize a custom extension. 
3. Review the extensions file example3/functions.js. 
4. We added a function that will call an Amazon API Gateway/AWS Lambda to perform the getItem. The creation of the API Gateway/Lambda/DynamoDB is outside the scope of this document. 

```
async function getRandomNode(context, events, done) {
  let res = await axios.get("https://<API_ENDPOINT>);
  context.vars['randomNode'] = res.data;
  return done();
};
```

5. Ensure you have your dependencies are in the same directory as the extension file.

```
npm install axios --save
```

6. The benchmark will now be able to query Neptune utilizing random UIDs from a list of a billion UIDs. 

```
cd example3
artillery run ./config.yml
```