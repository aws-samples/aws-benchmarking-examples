## AWS Benchmarking Examples

Benchmarking is a method to determine whether or not your architecture, application, or service can handle the load for your use-case. Many times, there are several performance requirements that need to be met for your project to be considered successful and without benchmarking your application, you would not know whether or not you have met your goals. Benchmarking can also reveal inefficient algorithms, bottlenecks, and bugs in your application and help you spend less time troubleshooting and more time making improvements to your application.

This repo contains configurations for two popular benchmarking frameworks: artillery and k6. Those configurations are used to benchmark two AWS services: Amazon Neptune and AWS AppSync. 

### Amazon Neptune

#### Example 1: Basic HTTP load testing
Simple HTTP Load testing with Artillery.

#### Example 2: Custom Artillery extensions
Artillery allows you to create custom extensions that run javascript code to create more complex scenarios. As an example I will showcase creating and utilizing a custom artillery extension to create random floating point numbers for making calls with random variables in the benchmark queries.

#### Example 3: Cached vs un-cached data 
One of the issues with testing a service like Amazon Neptune is getting results from cached and un-cached data. The differences in latency between the two can be quite different. For benchmarking performance on cached data, you can perform queries on a small set of data increasing the likelihood that you will be utilizing cached data. In order to benchmark un-cached data, you will need to introduce randomness in selecting data. This is simple if the data is sequentially named by utilizing random integers/floats. You can see Example 1 and Example 2 for how we utilize random integers/floats in our queries. But what if you had data ids like UIDs? Reading in a list of billions of UIDs and selecting a random UID is not scalable. A possible solution is to index the UIDs in a key value store like DynamoDB with an integer value as its key. Then generate a random integer and make a getItem on DDB for the UID which can be used in the query for benchmarking.

### AWS AppSync

#### Example 1: Basic HTTP load testing
Simple HTTP Load testing with k6.

#### Example 2: Custom metrics
Beyond the basic HTTP load testing shown above, there was a need to benchmark a situation where we make 2 HTTP calls in a particular user session and only record the faster of the two calls.  

#### Example 3: Benchmarking AWS services
During our benchmarking, we noticed that the majority of latency was coming from AWS Lambda resolver calls inside AppSync. In order to investigate the Lambda invokes, we setup an environment to mimic how AppSync calls Lambda. We can utilize k6 to perform the load testing but would need to augment k6 with the ability to sign HTTP requests with AWSsigv4 in order to authenticate with Lambda. 