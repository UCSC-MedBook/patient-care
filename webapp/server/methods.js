Meteor.methods({
  createTumorMapBookmark: function (study_label, sample_label, mapLabel) {
    // TODO: check if mapLabel is valid?
    check([study_label, sample_label, mapLabel], [String]);

    var user = MedBook.ensureUser(this.userId);
    user.ensureAccess(Studies.findOne({study_label}));

    // XXX
    let bookmark = "https://google.com/";

    // HTTP.call( 'METHOD', 'http://url.to/call', { "options": "to set" }, function( error, response ) {
    //   // Handle the error or response here.
    // });

    let setObj = {
      [ "tumor_map_bookmarks." + mapLabel ]: bookmark,
    };

    Samples.update({ study_label, sample_label }, {
      $set: setObj
    });
  },
});
