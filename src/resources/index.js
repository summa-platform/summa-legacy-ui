export function configure(config) {
  config.globalResources([
	  './binding-behaviors/one-way-out',
	  './value-converters/json',
	  './value-converters/keys',
	  './value-converters/join',
	  './elements/loading-indicator',
	  './attributes/open-new-tab',
  ]);
  // config.globalResources(['./binding-behaviors/one-way-out', './value-converters/json', './value-converters/iterable']);
}
