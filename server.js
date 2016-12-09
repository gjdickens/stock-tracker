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

var quoteData = [{ticker: "C", data: {} }, {ticker: "GS", data: {} }];
var url = 'https://www.quandl.com/api/v3/datasets/WIKI/'
var params = '.json?api_key=';


io.on('connection', function(socket) {
		var counter = quoteData.length;
		quoteData.map(function(arr, i) {
			if (Object.keys(quoteData[i].data).length === 0 && quoteData[i].data.constructor === Object) {
				var query = url + arr.ticker + params + process.env.QUANDL_KEY;
				https.get(query, function (apiRes) {
					var body = '';
					apiRes.on('data', function (d) {
						body += d;
					});
					apiRes.on('end', function (d) {
						var parsed = JSON.parse(body);
						quoteData[i].data = parsed.dataset;
						counter --;
						console.log(counter);
						if (counter === 0) {
							socket.emit('quoteData', quoteData);
						}
					});
				});
			}
			else {
				counter --;
				if (counter === 0) {
					socket.emit('quoteData', quoteData);
				}
			}
		});

		socket.on('newQuote', function (data) {
			var query = url + data + params + process.env.QUANDL_KEY;
			https.get(query, function (apiRes) {
				var body = '';
				apiRes.on('data', function (d) {
					body += d;
				});
				apiRes.on('end', function (d) {
					var parsed = JSON.parse(body);
					quoteData = quoteData.concat([ {ticker: data, data: parsed.dataset } ]);
					socket.emit('quoteData', quoteData);
				});
	  	});
		});

		socket.on('removeQuote', function (data) {
			quoteData = quoteData.filter(function(arr) {
				return arr.ticker !== data;
			});
			socket.emit('quoteData', quoteData);
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
