import {inject, Aurelia} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import config from 'config';
import log from 'logger';
import {Store} from 'store';


@inject(Aurelia, HttpClient, Store)
export default class AuthService {
	constructor(aurelia, httpClient, store) {
		this.app = aurelia;
		this.store = store;
		this.session = null;
		let session = localStorage['session'] || null;
		if(session) {
			this.userPromise = this.store.getUser(session).then(user => {
				this.store.currentUser = user;
				this.session = user.id;
				return user;
			}).catch(() => {
				this.session = null;
			});
		}
		// this.http = httpClient.configure(c => {
		// 	c.withBaseUrl(config.baseUrl);
		// });
		// this.session = JSON.parse(localStorage[config.tokenName] || null);
		// this.session = localStorage['session'] || null;
	}
	
	async login(email, password) {
		log.info('login');
		this.error = '';
		try {
			let login = await this.store.checkPassword(email, password);
			this.store.currentUser = login;
			this.session = 1;
			localStorage['session'] = login.id;
			this.app.setRoot('app');
			return true;
		} catch(e) {
			this.session = null;
			localStorage['session'] = '';
			if(e.response && e.response.status == 404) {
				let text = e.body && e.body.message || 'User not found.';
				this.error = text;
			} else if(e.response && e.response.status == 401) {
				this.error = e.body && e.body.message || 'Invalid login.';
			} else  {
				this.error = e.toString();
			}
			log.error(this.error);
			return;
		}
		// TODO: retrieve token from backend
		// this.http.post(config.loginUrl, { username, password })
		// 	.then((response) => response.content)
		// 	.then((session) => {
		// 		localStorage[config.tokenName] = JSON.stringify(session);
		// 		this.session = session;
		// 		this.app.setRoot('app');
		// 	});
	}

	logout() {
		log.info('logout');
		// localStorage[config.tokenName] = null;
		localStorage['session'] = '';
		this.session = null;
		this.app.setRoot('login');
	}

	async isAuthenticated() {
		await this.userPromise;
		// if(this.session && (!this.store.currentUser || this.store.currentUser.id != this.session)) {
		// 	// this.store.currentUserPromise = this.store.getUser(this.session).then(user => this.store.currentUser = user);
		// 	await this.userPromise;
		// 	// try {
		// 	// 	this.store.currentUser = await this.store.getUser(this.session);
		// 	// 	this.session = this.store.currentUser.id;
		// 	// } catch(e) {
		// 	// 	this.session = null;
		// 	// }
		// }
		return !!this.session;
	}
}
