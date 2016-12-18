import path from 'path';
import express from 'express';
import webpack from 'webpack';
import middleware from './src/middleware';

import http from 'http';
import socket from 'socket.io';

import https from 'https';
import BodyParser from 'body-parser';
import Mongoose from 'mongoose';


//var QUANDL_KEY = 'xiuCVEu_J9xapgUViBbn';

const app = express();
const server = http.Server(app);
const io = socket(server);


if(process.env.NODE_ENV === 'development') {
	const config = require('./webpack.config.dev');
	const compiler = webpack(config);
	app.use(require('webpack-dev-middleware')(compiler, {
		noInfo: true,
		publicPath: config.output.publicPath,
		stats: {
			assets: false,
			colors: true,
			version: false,
			hash: false,
			timings: false,
			chunks: false,
			chunkModules: false
		}
	}));
	app.use(require('webpack-hot-middleware')(compiler));
	app.use(express.static(path.resolve(__dirname, 'src')));
}

else if(process.env.NODE_ENV === 'production') {
	app.use(express.static(path.resolve(__dirname, 'dist')));
}

var port = process.env.PORT || 3000;


//configure MongoDB
const db = process.env.MONGOLAB_URI;

Mongoose.connect(db);

const conn = Mongoose.connection;

conn.on('error', console.error.bind(console, 'connection error:'));
conn.once('open', function() {
  console.log('database connected');
});


//Web Socket

var tickers = ["C", "GS"];
var url = 'https://www.quandl.com/api/v3/datatables/WIKI/PRICES.json?ticker='
var params = 'qopts.columns=ticker,date,close&api_key=';


io.on('connection', function(socket) {
		var tickerQuery = tickers.join();
		if(tickerQuery.length > 0) {
			var dateToday = new Date();
			var fiveYearsAgo = new Date();
			fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear()-5);
			var dateTodayString = dateToday.toISOString().substring(0, 10);
			var fiveYearsAgoString = fiveYearsAgo.toISOString().substring(0, 10);
			dateTodayString = dateTodayString.replace(/-/g, '');
			fiveYearsAgoString = fiveYearsAgoString.replace(/-/g, '');
			var dateQuery = '&date.gte='+ fiveYearsAgoString + '&date.lt=' + dateTodayString + '&';
			var query = url + tickerQuery + dateQuery + params + process.env.QUANDL_KEY;
					https.get(query, function (apiRes) {
						var body = '';
						apiRes.on('data', function (d) {
							body += d;
						});
						apiRes.on('end', function (d) {
							var parsed = JSON.parse(body);
							var data = parsed.datatable.data;
							var quoteData = tickers.map(function(arr, i) {
								var priceData = data.filter(function(x) {
									return x[0] === arr;
								});
								var finalPriceData = priceData.map(function(y, j) {
									return {ticker: y[0], date: y[1], close: y[2]};
								});
								return finalPriceData;
							});
							socket.emit('quoteData', quoteData);
						});
					});
			}
			else {
				socket.emit('quoteData', []);
			}


		socket.on('newQuote', function (data) {
			var newQuery = url + data + dateQuery + params + process.env.QUANDL_KEY;
			https.get(newQuery, function (apiRes) {
				var body = '';
				apiRes.on('data', function (d) {
					body += d;
				});
				apiRes.on('end', function (d) {
					var parsed = JSON.parse(body);
					var priceData = parsed.datatable.data;
					if(priceData.length > 0) {
						var finalPriceData = priceData.map(function(y, j) {
							return {ticker: y[0], date: y[1], close: y[2]};
						});
						tickers = tickers.concat([data]);
						io.sockets.emit('newQuoteData', finalPriceData);
					}
					else {
						socket.emit('invalidQuote', "invalid ticker");
					}

	  		});
			});
		});

		socket.on('removeQuote', function (data) {
			tickers = tickers.filter(function(arr) {
				return arr !== data;
			});
			io.sockets.emit('removeQuoteData', data);
		});
	});

app.get('*', middleware);

server.listen(port, '0.0.0.0', (err) => {
	if(err) {
		console.error(err);
	} else {
		console.info('Listening at ' + port);
	}
});
