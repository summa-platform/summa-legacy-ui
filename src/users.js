import {inject, bindable, observable, bindingMode, Aurelia} from 'aurelia-framework';
import log from 'logger';
import {Store} from 'store';
import {CompositionService} from 'composition-service';


@inject(Store, Aurelia, CompositionService)
export class Users {
	users = [];
	roleTypes = {};
	selectedUser;

	constructor(store, aurelia, compositionService) {
		this.aurelia = aurelia;
		this.store = store;
		this.compositionService = compositionService;
		this.store.getUsers().then(users => {
			this.users = users;
			this.selectedUser = this.currentUser = users.find(user => user.id === this.store.currentUser.id);
		});
		this.store.getUserRoleTypes().then(roleTypes => 
				this.roleTypes = roleTypes.reduce((acc, item) => { acc[item.internalval] = item.label; return acc; }, {}));
	}

	attached() {
	}

	async newUser() {
		let [dialog, destroy] = await this.compositionService.create('dialogs/user-settings-dialog');
		let user = await dialog.viewModel.new({});
		destroy();
		if(user) {
			log.debug('Created user:', user);
		}
	}

	async editUser(user) {
		user = Object.assign({}, user);	// unlink
		let [dialog, destroy] = await this.compositionService.create('dialogs/user-settings-dialog');
		dialog.viewModel.remove = (params) => { this.removeUser(params.$model); };
		user = await dialog.viewModel.edit(user);
		destroy();
		if(user) {
			log.debug('Patch user:', user);
			user = await this.store.saveUser(user);
			if(this.currentUser.id === user.id) {
				this.currentUser = user;	// just in case, needs to be tested
			}
			log.debug('patched user:', user);
		}
	}

	async removeUser(user) {
		let dialog, destroy;
		if(user.id == this.currentUser.id) {
			// cannot remove current user
			[dialog, destroy] = await this.compositionService.create('dialogs/info-dialog');
			await dialog.viewModel.open({
				title: `Delete User Denied`,
				body: `You cannot remove currently active user.`
			});
			return;
		}
		const users = await this.store.getUsers();
		const otherAdminExists = users.reduce((state, usr) => {
			return state || (usr.id != user.id && usr.role === 'admin' && !usr.isSuspended);
		}, false);
		if(!otherAdminExists) {
			[dialog, destroy] = await this.compositionService.create('dialogs/info-dialog');
			await dialog.viewModel.open({
				title: `Delete User Denied`,
				body: `No other active users with administrator role remain.`
			});
			return;
		}
		[dialog, destroy] = await this.compositionService.create('dialogs/confirmation-dialog');
		// dialog.viewModel.remove = (params) => { this.removeUser(params.$model); };
		let result = await dialog.viewModel.open({
			title: `Delete User Confirmation`,
			body: `Are you sure you want to delete the user ${user.name} ?`,
			btnClass: 'danger',
			btnTitle: 'Delete User'
		});
		if(result) {
			log.debug('Will remove user:', user);
			this.store.removeUser(user.id);
		}
	}

	selectUser(user) {
		this.selectedUser = user;
	}
}
