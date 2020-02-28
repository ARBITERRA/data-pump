import * as AWS from 'aws-sdk';
import * as dotenv from 'dotenv-flow';

import * as log from 'ololog';
import {
  green, red, yellow, underline,
} from 'ansicolor';
import { CCXTDataPumper } from './ccxtDataPumper';

import { Exchange, OrderBook } from 'ccxt';
const ccxt = require('ccxt');

import * as fs from 'fs';
import * as path from 'path';

import * as _ from 'lodash';

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

  const deadExchanges = ['cobinhood', 'coingi', 'vaultoro', 'coss',
                         'flowbtc', 'anxpro', 'stronghold', 'coolcoin',
                         'coinegg', 'bcex', 'btctradeim', 'fcoin',
                         'fcoinjp', 'bibox', 'xbtce']

  const exchanges = _.difference(ccxt.exchanges, deadExchanges);
  //const exchanges:string[] = ccxt.exchanges
  log(ccxt.exchanges.length, 'exchanges supported');
  log(deadExchanges.length, 'dead exchanges');
  log('Complete list:');
  exchanges.map(log);
		const exchangeOpts = { enableRateLimit: true };
		let eInstances = []
	// eInstances = exchanges.map((exchange:string) => new ccxt[exchange](exchangeOpts));
	eInstances = [new ccxt.binance(exchangeOpts)
  eInstances.forEach((exchange:Exchange) => {
    const dir = `${__dirname}/upload/${exchange.id}`;
    log('Creating directory', dir)
    fs.mkdir(dir, { recursive: true }, (err:any) => {
      if (err) {
        log(red(err));
      } else {
        log('Created', dir);
      }
    });    
  })

  const adp = new CCXTDataPumper(eInstances,
    ['ETH/BTC', 'USDT/BTC'],
    config);

  log(red('Does not support'))
  await adp.start()
    .then((results:any[]) => log('Pulling:', results))
    .then(() => Promise.all(eInstances.map((e:Exchange) => CCXTDataPumper.pull(e)))
    .catch((err:any) => log(red(err)))  
    .then((obs:OrderBook[][]) => {
      const dir = `${__dirname}/upload/`;
      for(let oba in obs)
        for(let ob in oba){
          let ws = fs.createWriteStream(`${dir}/${ob.exchangeId}`)
          ws.write(ob);
          ws.close()
        }
      // let ws = fs.createWriteStream(`${dir}/upload.json`)
      // ws.write(JSON.stringify(obs, null, 2));
      // ws.close();
    }));    
};

main(process.argv)
  .then(() => console.log('Finished...'));
