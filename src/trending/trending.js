import {inject, bindable, observable} from 'aurelia-framework';
import {Router, Redirect} from 'aurelia-router';
import log from 'logger';
import {Store} from 'store';
import {CompositionService} from 'composition-service';
import {Services} from 'services';


@inject(Store, Router, CompositionService, Services)
export class Trending {

	allQueries = [];
	@observable selectedQuery;
	newQueryModal = undefined;
	editQueryModal = undefined;

	constructor(store, router, compositionService, services) {
		this.store = store;
		this.router = router;
		this.compositionService = compositionService;
		this.services = services;
		this.queriesPromise = this.store.getQueries().then(queries => this.allQueries = queries);
	}

	activate(params, routeConfig) {
		this.params = params;

		// fast
		if(this.services.query) {
			this.selectedQuery = this.services.query;
			this.queriesPromise.then(queries => {
				if(this.selectedQuery) {
					let query = queries.find(query => query.id === this.selectedQuery.id);
					if(query) {
						this.selectQuery(query, true);
					}
				} else {
					this.selectQuery(undefined, true);
				}
			});
		}
	}

	async attached() {
		// moved from activate() because route was not correctly set up, so navigate does not work correctly from activate
		if(this.params.queryID === 'all') {
			this.selectQuery();
		} else if(this.params.queryID) {
			let queryID = this.params.queryID;
			// get from list by id
			this.queriesPromise.then(queries => {
				let query = queries.find(query => query.id === queryID);
				if(query) {
					this.selectQuery(query);
				}
			});
		}
	}

	async newQuery() {
		let query = await this.services.newQuery();
		if(query) {
			this.allQueries = await this.store.getQueries();
			this.router.navigateToRoute('query-trending-id', { queryID: query.id }, { trigger: true });	// to query trending view
		}
	}

	async editQuery(query) {
		if(query) {
			query = Object.assign({}, await this.store.getQuery(query.id));
		}
		log.debug('Edit query:', query);
		let [dialog, destroy] = await this.compositionService.create('dialogs/query-settings-dialog');
		dialog.viewModel.remove = (params) => { this.removeQuery(params.$model); };
		query = await dialog.viewModel.edit(query);
		destroy();

		if(query) {
			await this.store.saveQuery(query);
		}
	}

	async removeQuery(query) {
		let [dialog, destroy] = await this.compositionService.create('dialogs/confirmation-dialog');
		let result = await dialog.viewModel.open({
			title: `Delete Query`,
			body: `Are you sure you want to delete query ${query.name} ?`,
			btnClass: 'danger',
			btnTitle: 'Delete Query'
		});
		if(result) {
			try {
				log.debug('Remove query:', query);
				let result = await this.store.removeQuery(query.id);
				this.selectedQuery = undefined;
			} catch(e) {
				console.error(e);
			}
		}
	}

	async selectQuery(query, skipNavigation) {
		if(!skipNavigation) {
			// change representing route
			if(query)
				this.router.navigateToRoute('query-trending-id', { queryID: query.id }, { trigger: false });
			else
				this.router.navigateToRoute('query-trending-id', { queryID: 'all' }, { trigger: false });
		}

		log.debug('Select query:', query);
		this.selectedQuery = query;
		this.trending = undefined;
		this.trendingForQueryInProgress = query && query.id;
		const trending = await this.store.getQueryTrending(query && query.id);
		if(this.trendingForQueryInProgress !== (query && query.id))
			return;
		// this.selectedQuery = Object.assign(this.selectedQuery, query);
		// trending = this.selectedQuery.trending;

		function binsToArray(binsObject) {
			const bins = [];
			let total = 0;
			for(let i=0; i<24; ++i) {
				total += bins[i] = binsObject[i-23 || '-0'] || 0;	// from -24 till 0
				// total += bins[i] = binsObject[-i || '-0'] || 0;	// from 0 till -24
			}
			return { bins, total };
		}

		function entityTrend(entity) {
			const bins = [];
			let total = 0;
			for(let i=0; i<24; ++i) {
				total += bins[i] = entity.bins[i-23 || '-0'] || 0;	// from -24 till 0
				// total += bins[i] = entity.bins[-i || '-0'] || 0;	// from 0 till -24
			}
			entity.bins = bins;
			entity.total = total;
			return entity;
		}

		function trendsOfEntities(trendsObject) {
			const trends = [];
			for(let entity of trendsObject) {
				trends.push(entityTrend(entity));
			}
			return trends;
		}

		if(trending.allItems) {
			if(trending.allItems.newlyAdded) {
				trending.allItems.newlyAdded = binsToArray(trending.allItems.newlyAdded);
			}
			if(trending.allItems.ofThoseDone) {
				trending.allItems.ofThoseDone = binsToArray(trending.allItems.ofThoseDone);
			}
		}

		trending.selectedEntities = trendsOfEntities(trending.selectedEntities2 || trending.selectedEntities);
		trending.topKEntities = trendsOfEntities(trending.topKEntities2 || trending.topKEntities);
		trending.topKEntities.sort((a, b) => {
			return b.total - a.total;
		});

		// if(this.selectedQuery)
		// 	this.selectedQuery.trending = trending;
		this.trending = trending;
		
		this.services.query = this.selectedQuery;
	}

	storiesForQuery(query, event) {
		// if(!this.selectedQuery)
		// 	return true;
		if(!query) {
			query = { id: 'all' };
		}

		const route = 'stories';
		const params = { queryID: query.id };

		if(event !== undefined && (event === true || event.altKey || event.ctrlKey || event.shiftKey || event.metaKey)) {
			// use any modifier as an excuse to open in separate tab/window
			const url = this.router.generate(route, params);
			window.open(url, '_blank');
		} else {
			this.router.navigateToRoute(route, params, { trigger: true });
		}
	}

	selectBin(trend, binIndex, event) {
		// if(!this.selectedQuery)
		// 	return;
		const pastHour = -(binIndex-23);

		const params = {
			queryID: this.selectedQuery && this.selectedQuery.id || 'all',
			pastHour: this.trending.epochTimeSecs+'-'+pastHour,
			entity: trend.baseForm
		};

		if(this.services.altTouch || event.altKey || event.shiftKey || event.metaKey || event.ctrlKey) {
			// use any modifier as an excuse to open in separate tab/window
			const url = this.router.generate('hour-media-items', params);
			window.open(url, '_blank');
		} else {
			this.router.navigateToRoute('hour-media-items', params, { trigger: true });
		}
	}
}
