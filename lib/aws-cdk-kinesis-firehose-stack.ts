import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as firehose from '@aws-cdk/aws-kinesisfirehose-alpha';
import * as destinations from '@aws-cdk/aws-kinesisfirehose-destinations-alpha';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Code, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { FilterPattern, ILogGroup, ILogSubscriptionDestination, LogSubscriptionDestinationConfig, SubscriptionFilter } from 'aws-cdk-lib/aws-logs';
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

class CustomDataFirehoseDestination implements ILogSubscriptionDestination {
  private readonly firehose: firehose.DeliveryStream;
  private readonly role: Role;

  constructor(scope: Construct, id: string, firehose: firehose.DeliveryStream) {
    this.firehose = firehose;

    // IAM Role enabling CloudWatch access to Firehose
    // Based on bullets 9/10/11: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/SubscriptionFilters.html#FirehoseExample
    this.role = new Role(scope, `${id}LogToFirehoseRole`, {
      assumedBy: new ServicePrincipal('logs.amazonaws.com'),
      inlinePolicies: {
        logToFirehosePolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['firehose:PutRecord', 'firehose:PutRecordBatch'],
              resources: [this.firehose.deliveryStreamArn],
            }),
          ],
        }),
      },
    });
  }

  bind(_scope: Construct, _sourceLogGroup: ILogGroup): LogSubscriptionDestinationConfig {
    return {
      arn: this.firehose.deliveryStreamArn,
      role: this.role,
    };
  }
}

export class AwsCdkKinesisFirehoseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hello = new Function(this, "HelloHandler", {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset("lambda"),
      handler: 'hello.handler',
    });
    const gateway = new LambdaRestApi(this, 'Endpoint', {
      handler: hello,
    });

    const bucket = new Bucket(this, 'MyFirehoseDestinationBucket');
    const destination = new destinations.S3Bucket(bucket, {
      bufferingInterval: cdk.Duration.seconds(0),
      loggingConfig: new destinations.EnableLogging(),
    });
    const v2Firehose = new firehose.DeliveryStream(this, 'Test Delivery Stream', {
      destination: destination
    });

    const subscription = new SubscriptionFilter(this, 'SubscribeHelloLogsToFirehose', {
      logGroup: hello.logGroup,
      destination: new CustomDataFirehoseDestination(this, 'CustomCloudWatchSubscriptionDestination', v2Firehose),
      filterPattern: FilterPattern.allEvents(),
    });

  }
}
