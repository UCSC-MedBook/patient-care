Meteor.startup(function() {
  // for typeahead search
	// initializes all typeahead instances
	Meteor.typeahead.inject();
	console.log("startup.js running");
});

// example for server side search
// this is code that was put here to work with the typeahead thing
Template.server_side.helpers({
	search: function(query, sync, callback) {
		console.log("search helper function");
		Meteor.call('search', query, {}, function(err, res) {
			console.log("search Meteor method callback");
			if (err) {
				console.log(err);
				return;
			}
			callback(res.map(function(v){ return {value: v.name}; }));
		});
	}
});
