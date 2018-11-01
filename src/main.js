require('node_modules/babel-polyfill/dist/polyfill.js'); // for async/await: $ npm install babel-polyfill --save

import environment from './environment';
import * as LogManager from 'aurelia-logging';
// import {ConsoleAppender} from 'aurelia-logging-console';
import AuthService from 'auth-service';

import 'whatwg-fetch';	// Fetch API polyfill

export function configure(aurelia) {

	// LogManager.addAppender(new ConsoleAppender());
	if(environment.debug) {
		LogManager.setLevel(LogManager.logLevel.debug);
	}

	aurelia.use
		.standardConfiguration()
		.feature('one-way-out')
		.feature('validation')
		.plugin('aurelia-animator-css')
		.plugin('aurelia-notify', settings => {
			settings.containerSelector = '#notification-container';
			settings.timeout = 5000;
		})
		.plugin('aurelia-hammer')
  		// .feature('resources/value-converters/iterable')
		.feature('resources');

	if (environment.debug) {
		aurelia.use.developmentLogging();
	}

	if (environment.testing) {
		aurelia.use.plugin('aurelia-testing');
	}

	// aurelia.start().then(() => aurelia.setRoot());
	// aurelia.start().then(() => aurelia.setRoot('login'));
	aurelia.start().then(async () => {
		let auth = aurelia.container.get(AuthService);
		let root = (await auth.isAuthenticated()) ? 'app' : 'login';
		// root = 'login';
		aurelia.setRoot(root);
	});
}
