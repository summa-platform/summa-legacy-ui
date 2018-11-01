import {inject, bindable, observable, computedFrom} from 'aurelia-framework';
import {Router, Redirect} from 'aurelia-router';
import log from 'logger';
import {Store} from 'store';
import {Services} from 'services';
import moment from 'moment';
import {CompositionService} from 'composition-service';


@inject(Store, Router, Services, CompositionService)
export class MediaItem {

	selectedMediaItem;

	constructor(store, router, services, compositionService) {
		this.store = store;
		this.router = router;
		this.services = services;
		this.compositionService = compositionService;
	}

	@computedFrom('mediaItem')
	get mediaItemTitle() {
		if(!this.mediaItem) {
			return '';
		}
		return typeof this.mediaItem.title === 'object' ? this.mediaItem.title.english || this.mediaItem.title.original : this.mediaItem.title;
	}

	async activate(params, routeConfig, navigationInstruction) {
		this.params = params;
		this.routeConfig = routeConfig;
		// this.navigationInstruction = navigationInstruction;

		// fast
		if(this.services.query && this.services.query.id === this.params.queryID) {
			this.query = this.services.query;
		} else {
			this.query = undefined;
		}
		if(this.services.story && this.services.story.id === this.params.storyID) {
			this.story = this.services.story;
		} else {
			this.story = undefined;
		}
		if(this.services.mediaItem && this.services.mediaItem.id === this.params.mediaItemID) {
			this.mediaItem = this.services.mediaItem;
		} else {
			this.mediaItem = undefined;
		}
		if(this.services.feed && this.services.feed.id === this.params.feedID) {
			this.feed = this.services.feed;
		} else {
			this.feed = undefined;
		}


		if(this.params.queryID && this.params.queryID !== 'all') {
			// only needed to set query name in path bar
			// this.store.getQueryStories(this.params.queryID).then(query => { this.query = query; this.services.query = query; });
			this.store.getQuery(this.params.queryID).then(query => { this.query = query; this.services.query = query; this.setTitle(); });

			// only needed to set story name in path bar
			// this.store.getStory(this.params.storyID).then(story => { this.story = story; this.services.story = story; });
			if(this.params.storyID) {
				this.store.getQueryStory(this.params.queryID, this.params.storyID).then(story => { this.story = story; this.services.story = story; });
			} else {
				this.services.story = this.story = undefined;
			}
		}
		if(this.params.feedID) {
			this.store.getFeed(this.params.feedID).then(feed => { this.feed = feed; this.services.feed = feed; this.setTitle(); });
		}
		if(this.params.pastHour) {
			this.pastHour = this.params.pastHour.split('-', 2)[1];
		}

		this.store.getMediaItem(this.params.mediaItemID).then(mediaItem => {
			if(mediaItem.summary && mediaItem.summary instanceof Array) {
				mediaItem.summary = mediaItem.summary.join(' ');
			}
			this.mediaItem = mediaItem;
			this.services.mediaItem = mediaItem;
		});
	}

	setTitle() {
		if(this.params.entity && this.params.pastHour) {
			let queryName = this.query ? this.query.name : 'All';
			// this.title = `Media Items of Query: ${queryName} and Entity: ${this.params.entity} for past hour: -${this.pastHour}`;
			this.title = `Media Items with Entity "${this.params.entity}" of Query "${queryName}" from ${this.pastHour}h ago`;
		} else if(this.feed && this.params.pastHour) {
			this.title = `Media Items from Feed "${this.feed.name}" from ${this.pastHour}h ago`;
		} else {
			this.title = undefined;
		}
	}

	attached() {
		this.setTitle();
	}

	async newQuery() {
		let query = await this.services.newQuery();
		if(query) {
			this.router.navigateToRoute('query-trending-id', { queryID: query.id }, { trigger: true });	// to query trending view
			// this.router.navigateToRoute('stories', { queryID: query.id }, { trigger: true }); // to stories view
		}
	}

	async openMediaItem(id, event) {
		const route = 'media-item';
		const params = { mediaItemID: id };

		if(this.services.altTouch || event.altKey || event.ctrlKey || event.shiftKey || event.metaKey) {
			// use any modifier as and excuse to open in separate tab/window
			const url = this.router.generate(route, params);
			window.open(url, '_blank');
		} else {
			this.router.navigateToRoute(route, params, { trigger: true });
		}
	}

	async createNewBookmark() {

		let mediaItem = this.mediaItem;
		let [dialog, destroy] = await this.compositionService.create('dialogs/bookmark-settings-dialog');
		let bookmark = { type: 'media-item', title: this.mediaItemTitle,
			item: {
				timeAdded: mediaItem.timeAdded,
				timeLastChanged: mediaItem.timeLastChanged,
				title: mediaItem.title,
				summary: mediaItem.summary,
				teaser: mediaItem.teaser,
				storyId: mediaItem.storyId,
				source: mediaItem.source,
				originalMultiMedia: mediaItem.originalMultiMedia,
				mediaItemType: mediaItem.mediaItemType,
				keywords: mediaItem.keywords,
				id: mediaItem.id,
				detectedLangCode: mediaItem.detectedLangCode,
			}
		};
		bookmark = await dialog.viewModel.new(bookmark);
		destroy();

		if(bookmark) {
			log.debug('New bookmark:', bookmark);
			try {
				await this.store.addBookmark(bookmark);
			} catch(e) {
				console.error('error storing bookmark');
				console.error(e);
			}
		} else {
			log.info('Add bookmark dialog cancelled');
		}
	}
}
