import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import AuthService from 'auth-service';

@inject(AuthService, Router)
export class Logout {
	constructor(authService, router) {
		this.auth = authService;
		this.router = router;
	}

	attached() {
		this.router.history.navigateBack();
		// this.router.navigate('/', {trigger: true});
		this.auth.logout();
	}
}
