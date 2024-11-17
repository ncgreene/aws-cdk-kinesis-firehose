#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsCdkKinesisFirehoseStack } from '../lib/aws-cdk-kinesis-firehose-stack';

const app = new cdk.App();
new AwsCdkKinesisFirehoseStack(app, 'AwsCdkKinesisFirehoseStack', {});