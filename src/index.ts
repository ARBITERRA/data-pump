import * as AWS from 'aws-sdk';
import * as dotenv from 'dotenv-flow';
import * as ccxt from 'ccxt';
import {
  binance, huobipro, cex, kraken, exchanges,
} from 'ccxt';

import * as log from 'ololog';
import { CCXTDataPumper } from './ccxtDataPumper';

dotenv.config();

AWS.config.apiVersions = {
  kinesis: '2013-12-02',
  // other service API versions
};

const main = async (params:any[]):Promise<void> => {
  console.log(`Application is running with: ${params.slice(2)}`);

  const config = new AWS.Config({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

  log('The total of ', exchanges.length, 'exchanges supported');
  log('Complete list:');
  exchanges.map(log);

  const adp = new CCXTDataPumper([
    new binance({ enableRateLimit: true }),
    new huobipro({ enableRateLimit: true }),
    new cex({ enableRateLimit: true }),
    new kraken({ enableRateLimit: true }),
  ], ['ETH/BTC', 'USDT/BTC'], config);

  const results:any = await adp.start();

  log('Pulling:', results);
  await CCXTDataPumper.pull(adp.exchanges[0]);
  log(results);
  // await adp.signal();
};

main(process.argv)
  .then(() => console.log('Finished...'));
