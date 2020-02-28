/* eslint-disable no-unused-vars */
import {
  Exchange, Market, OrderBook, Dictionary,
} from 'ccxt';

import * as async from 'async';
import * as _ from 'lodash';

import {
  green, red, yellow, underline,
} from 'ansicolor';
import * as log from 'ololog';
import { AbstractDataPumper } from './dataPumper';


export class CCXTDataPumper extends AbstractDataPumper {
  public symbols:string[];

  public exchanges:Exchange[];

  constructor(exchanges:Exchange[], symbols:string[], opts:any) {
    super(opts);
    this.exchanges = exchanges;
    this.symbols = symbols;
  }

  public async start():Promise<any> {
    // return async.map(this.exchanges, (exchange:Exchange) => {
    //   log(red('Starting exchange'), exchange.name);
    //   exchange.loadMarkets().then((markets:Dictionary<Market>) => log(markets))
    // })
    const tasks = _.map(this.exchanges, (exchange:Exchange) => async () => Promise.resolve()
      .then(() => log(green('Creating stream'), red(exchange.id)))
      .then(() => this.kinesis.createStreamAsync({
        StreamName: exchange.id,
        ShardCount: 1,
      }))
      .catch((err:any) => log(red(err)))
      .then(() => log('Data put on stream'))
      .then(() => log('Markets record put for exchange', exchange.id))
      .then(() => exchange.loadMarkets())
      .then((markets:Dictionary<Market>) => this.kinesis.putRecord({
        Data: markets,
        StreamName: exchange.id,
        PartitionKey: '0',
      })));
    log('Running', tasks.length, 'tasks');
    return new Promise((resolve) => async.parallel(tasks, resolve));
  }

  public static async pull(exchange:Exchange) {
    log('Pulling data from', exchange.id, 'for', exchange.markets.length, 'markets');
    const markets:string[] = Object.keys(exchange.markets);
    log('on markets', markets);
    const fetchFunctions = markets.map((market:string) => async () => {
      log('Loading data for', market);
      return exchange
        .fetchOrderBook(exchange.markets[market].symbol)
        .then((ob:OrderBook) => {
          console.log(new Date(), exchange.id, market, ob.asks[0], ob.bids[0]);
          return ob
        });
    });

    do { // infinite loop
      log('Fetching round');
      /* eslint-disable no-await-in-loop */
      await Promise.all(fetchFunctions);
    } while (true);
  }


  public stop():any {
    return this;
  }
}
