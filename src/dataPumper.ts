import * as AWS from 'aws-sdk';
import * as log from 'ololog';
import {
  green, red, yellow, underline,
} from 'ansicolor';

import * as Bluebird from 'bluebird';

export interface IPromisifedS3 extends AWS.S3 {
    [x: string]: any
}

export interface IPromisifedKinesis extends AWS.Kinesis {
    [x: string]: any
}

log.configure({ concat: { separator: '' } });

abstract class AbstractDataPumper {
  public kinesis:IPromisifedKinesis;

  constructor(opts:any) {
    // nothing to do
    this.kinesis = new AWS.Kinesis(opts);
    this.kinesis.createStreamAsync = Bluebird.promisify(this.kinesis.createStream);
    this.kinesis.waitForAsync = Bluebird.promisify(this.kinesis.waitFor);
    this.kinesis.putRecordsAsync = Bluebird.promisify(this.kinesis.putRecords);
    console.log('Kinesis created');

    // const params = {
    //   StreamName: 'binance', /* required */
    // };

    // this.kinesis
    //   .waitForAsync('streamExists', params)
    //   .then((data:any) => log(yellow(JSON.stringify(data, null, 2))))
    //   .catch((err:any) => log(red(err)));
  }

  public abstract start():void;

  public abstract stop():void;

  async signal() {
    log(green('Starting'), underline(red('KINESSIS')), green('stream'), this);
    return Promise.all([
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
  }
}

export { AbstractDataPumper };
