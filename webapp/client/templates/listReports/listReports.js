Template.listReports.helpers({

  getGeneReports: function () {
    return GeneReports.find({}, {sort: { "gene_label": 1 }, limit: 100});
  },
  getPathwayReports: function () {
    return ["Pathway 1", "Pathway 2", "Pathway 3"];
  },

});

Template.listPatients.onCreated(function () {
  var instance = this;

  // set them to defaults
  instance.filterWithProgression = new ReactiveVar(false);
  instance.filterWithRNASeek = new ReactiveVar(false);

  // set checkmarks to match user profile
  var loadedUserId = new ReactiveVar(undefined);
  this.autorun(function (computation) {
    if (Meteor.user() && Meteor.userId() !== loadedUserId.get()) {
      loadedUserId.set(Meteor.userId()); // don't run again for this user

      var context = Meteor.user().profile.patient_care;
      if (context === undefined) {
        context = {};
      }

      console.log("setting instance variables from profile");
      if (context.filter_with_progression !== undefined) {
        instance.filterWithProgression.set(
          context.filter_with_progression
        );
        console.log("instance.filterWithProgression.get(): ", instance.filterWithProgression.get());
      }

      if (context.filter_with_rna_seek !== undefined) {
        instance.filterWithRNASeek.set(
          context.filter_with_rna_seek
        );
        console.log("instance.filterWithRNASeek.get(): ", instance.filterWithRNASeek.get());
      }
    }
  });

  // set user profile to match checkmarks
  this.autorun(function() {
    // have to try to load before profile
    if (loadedUserId.get() !== undefined) {
      var context = Meteor.user().profile.patient_care;
      if (context === undefined) {
        context = {};
      }

      // make sure something's changed
      if (context.filter_with_progression !== instance.filterWithProgression.get() ||
          context.filter_with_rna_seek !== instance.filterWithRNASeek.get()) {
        Meteor.users.update({ _id: Meteor.user()._id }, {
          $set: {
            "profile.patient_care.filter_with_progression": instance.filterWithProgression.get(),
            "profile.patient_care.filter_with_rna_seek": instance.filterWithRNASeek.get()
          }
        });
      }
    }
  });
});

Template.listPatients.helpers({
  getPatientReports: function () {
    var instance = Template.instance();
    var findObject = {};

    if (instance.filterWithProgression.get()) {
      findObject["metadata.sample_labels_count"] = { $gt: 1 };
    }
    if (instance.filterWithRNASeek.get()) {
      findObject["metadata.is_in_signatures"] = true;
    }

    return PatientReports.find(findObject, { sort: { "patient_label": 1 } });
  },
  filterWithProgression: function () {
    return Template.instance().filterWithProgression.get();
  },
  filterWithRNASeek: function () {
    return Template.instance().filterWithRNASeek.get();
  },
});

Template.listPatients.events({
  "change #filter-with-progression input": function (event, instance) {
    console.log("filter-with-progression input changed:", event.target.checked);
    instance.filterWithProgression.set(event.target.checked);
  },
  "change #filter-with-rna-seek input": function (event, instance) {
    console.log("filter-with-rna-seek input changed:", event.target.checked);
    instance.filterWithRNASeek.set(event.target.checked);
  },
});

// // Create an index on the name field of BigCollection
// BigCollection._ensureIndex({name: 1});
