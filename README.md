# AWS Data Firehose

Create a Data Firehose with it's source as a cloudwatch log subscription and destination as an s3 bucket.

## Deploy / Test

You'll need an AWS account and to have your cdk configured.

Install dependencies:

```bash
npm i
```

Deploy CDK:

```bash
cdk deploy
```

From the cdk output, you will see an API gateway URL. Execute a request against this URL to generate some logs (aka trigger the subscription). Your request will look something like this:

```bash
curl https://3d9i8ds7jd.execute-api.us-west-2.amazonaws.com/prod/test/the/hose
```

Now go and look at your destination s3 bucket and you'll find the zipped logs.

## Implementation Notes

Currently there is no construct available in cloudwatch for a firehose destination, likely because firehose v2 constructs are in alpha right now. So I made one that implements the `bind` function required by the `ILogSubscriptionDestination` interface.

