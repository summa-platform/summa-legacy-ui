import {inject, bindable, observable} from 'aurelia-framework';
import {Store} from 'store';
import {Router, Redirect} from 'aurelia-router';
import {Services} from 'services';

@inject(Store, Router, Services)
export class FeedSettingsDialog {

	@bindable model;
	bins = [];

	constructor(store, router, services) {
		this.store = store;
		this.router = router;
		this.services = services;
	}

	selectBin(binIndex, event, resolve) {
		const pastHour = -(binIndex-23);

		const params = {
			feedID: this.model.id,
			pastHour: this.epochTimeSecs+'-'+pastHour
		};

		// TODO: use router to generate url (route to sibling subrouter)
		let url = '#/trending/feeds/:feedID/hours/:pastHour/media-items';
		for(const param of Object.keys(params)) {
			let re = new RegExp(':'+param, 'g');
			url = url.replace(re, params[param])
		}

		if(this.services.altTouch || event.altKey || event.shiftKey || event.metaKey || event.ctrlKey) {
			// use any modifier as and excuse to open in separate tab/window
			window.open(url, '_blank');
		} else {
			window.location.href = url;
			resolve(); // dismiss dialog
		}
	}

	async modelChanged(feed) {

		let trending = await this.store.getFeedTrending(feed.id);
		// trending.epochTimeSecs
		// trending.last24hStats

		this.epochTimeSecs = trending.epochTimeSecs;
		const trendObject = trending.last24hStats;

		const bins = [];
		let total = 0;
		for(let i=0; i<24; ++i) {
			total += bins[i] = trendObject[i-23 || '-0'] || 0;	// from -24 till 0
			// total += bins[i] = trendObject[-i || '-0'] || 0;	// from 0 till -24
		}
		this.bins = bins;
	}

	async check(feed, validate, resolve) {
		let result = await validate();
		if(result.valid) {
			resolve(feed);
		}
	}
}
