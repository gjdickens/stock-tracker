import React from 'react';
import { renderToString } from 'react-dom/server';
import { match, RouterContext } from 'react-router';
import routes from './routes';

export default (req, res) => {
	match(
		{ routes, location: req.url },
		(err, redirectLocation, renderProps) => {

			// in case of error display the error message
			if (err) {
				return res.status(500).send(err.message);
			}

			// in case of redirect propagate the redirect to the browser
			if (redirectLocation) {
				return res.redirect(302, redirectLocation.pathname + redirectLocation.search);
			}

			// generate the React markup for the current route
			if (renderProps) {
				if(process.env.NODE_ENV == 'development') {
					res.status(200).send(`
						<!doctype html>
						<html>
							<header>
								<title>Stock Tracker</title>
								<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
							</header>
							<body>
								<div id='app'></div>
								<script src='bundle.js'></script>
							</body>
						</html>
					`);
				} else if(process.env.NODE_ENV == 'production') {
					res.status(200).send(`
						<!doctype html>
						<html>
							<header>
								<title>Stock Tracker</title>
								<link rel='stylesheet' href='bundle.css'>
								<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
							</header>
							<body>
								<div id='app'>${renderToString(<RouterContext {...renderProps}/>)}</div>
								<script src='bundle.js'></script>
							</body>
						</html>
					`);
				}
			}

			else {
				// otherwise we can render a 404 page
				markup = renderToString(<NotFoundPage/>);
				res.status(404);
			}
		}
	);
	};
