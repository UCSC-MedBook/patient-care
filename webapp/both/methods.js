Meteor.methods({
  emails: function() {
    return [
      'stodyshev@gmail.com'
    ];
  },
  search: function(query, options) {
    if (!query) return [];

    options = options || {};

    // guard against client-side DOS: hard limit to 50
    if (options.limit) {
      options.limit = Math.min(50, Math.abs(options.limit));
    } else {
      options.limit = 50;
    }

    // TODO fix regexp to support multiple tokens
    var regex = new RegExp(query.split("").join("*"), "i");
    console.log("regex: ", regex);
    return [{name: "hello"}, {name: "world"}];
  }
});
