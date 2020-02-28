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

interface IPromisifedOrderBook extends OrderBook {
    [x: string]: any
}

export class CCXTDataPumper extends AbstractDataPumper {
  public symbols:string[];

  public exchanges:Exchange[];

  constructor(exchanges:Exchange[], symbols:string[], opts:any) {
    super(opts);
    this.exchanges = exchanges;
    this.symbols = symbols;
  }

  public start():Promise<any> {
    // return async.map(this.exchanges, (exchange:Exchange) => {
    //   log(red('Starting exchange'), exchange.name);
    //   exchange.loadMarkets().then((markets:Dictionary<Market>) => log(markets))
    // })
    const tasks = _.map(this.exchanges, (exchange:Exchange) => Promise.resolve()
      .then(() => log(green('Creating stream'), red(exchange.id)))
    // .then(() => this.kinesis.createStreamAsync({
    //   StreamName: exchange.id,
    //   ShardCount: 1,
    // }))
      .catch((err:any) => log(red(err)))
      .then(() => log('Markets record put for exchange', exchange.id))
			.then(() => exchange.loadMarkets())
      .catch((err:any) => log(red(exchange.id), err)))
    log('Running', tasks.length, 'tasks');
    return Promise.all(tasks);
  }

		public static pull(exchange:Exchange):Promise<OrderBook[][]> {
				log('Pulling data from', exchange.id, 'for', exchange.markets.length, 'markets');
				const markets:string[] = Object.keys(exchange.markets);
			log('on markets', markets);
      
				// const fetchFunctions = markets.map((market:string):Promise<OrderBook> => {
				// 		log('Loading data for', market);
				// 		return exchange
				// 				.fetchOrderBook(exchange.markets[market].symbol)
				// 				.then((ob:OrderBook) => {
				// 						console.log(new Date(), exchange.id, market, ob.asks[0], ob.bids[0]);
				// 						(ob as IPromisifedOrderBook).exchangeId = exchange.id;
				// 						return ob;
				// 				})
				// 				.catch((err:any) => log(red(err)))
				// 				.then(():OrderBook => {										
				// 						return {
				// 								asks: [],
				// 								bids: [],
				// 								datetime: new Date().toString(),
				// 								timestamp: Date.now(),
				// 								nonce: 0,
				// 								exchangeId:exchange.id
				// 						} as IPromisifedOrderBook
				// 				})
			// });
      const fetchFunctions:Promise<OrderBook[]>[] = [new Promise((resolve:any):void => {
        log(green('Fetched OrderBook[] for exchange'), exchange.id);
        resolve(exchange.fetchOrderBooks())
      })]



				//    do { // infinite loop
				log('Fetching round');
				/* eslint-disable no-await-in-loop */
				return Promise.all(fetchFunctions)
				/* eslint-disable no-constant-condition */
				//    } while (true);
		}


		public stop():any {
				return this;
		}
}
