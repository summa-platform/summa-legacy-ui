import { inject, Aurelia } from 'aurelia-framework';
import AuthService from 'auth-service';
import log from 'logger';

@inject(Aurelia, AuthService)
export class Login {
	email = '';
	password = '';
	error = '';

	constructor(aurelia, authService) {
		this.auth = authService;

		this.auth.isAuthenticated().then(auth => { if(auth) aurelia.setRoot('app'); });
	}

	async login() {
		if(this.email && this.password) {
			if(!await this.auth.login(this.email, this.password)) {
				this.error = this.auth.error || 'Invalid login. Please try again.';
				// this.error = 'Invalid login. Please try again.';
			} else {
				this.error = '';
			}
		} else {
			this.error = 'Please enter a username and password.';
		}
	}
}
