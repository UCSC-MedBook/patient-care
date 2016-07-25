// Template.createSampleGroup

Template.createSampleGroup.onCreated(function() {
  let instance = this;

  instance.newSampleGroup = new ReactiveVar();
  instance.error = new ReactiveVar();
});

Template.createSampleGroup.helpers({
  nameAndDescription() {
    return SampleGroups.simpleSchema().pick(["name", "description"]);
  },
  error() { return Template.instance().error },
  newSampleGroup() { return Template.instance().newSampleGroup },
});

Template.createSampleGroup.events({
  "click .create-sample-group"(event, instance) {
    let sampleGroup = instance.newSampleGroup.get();

    Meteor.call("createSampleGroup", sampleGroup, (error, selected) => {
      if (error) {
        if (error.reason === "Match failed") {
          // there might be edge cases here which I haven't found yet so other
          // messages might have to be shown instead
          instance.error.set({ header: "Please correct errors above" });
        } else if (!error.details) {
          console.log("error:", error);
          instance.error.set({
            header: "Internal server error",
            message: error.reason || "Error: " + error.error,
          });
        } else {
          console.log("error:", error);
          instance.error.set({
            header: error.reason,
            message: error.details
          });
        }
      } else {
        FlowRouter.setParams({ selected });
      }
    });
  },
});

// Template.showSampleGroup

Template.showSampleGroup.helpers({
  slugToString: MedBook.utility.slugToString,
  downloadUrl() {
    let userId = Meteor.userId();
    let loginToken = Accounts._storedLoginToken();

    return `/download/${userId}/${loginToken}/data-collection/` +
        `SampleGroups/${this._id}`;
  },
  totalSampleCount() {
    return _.reduce(this.data_sets, (memo, sgDataSet) => {
      return memo + sgDataSet.sample_count;
    }, 0);
  },
});

// Sample Group Expression Level & Variance Filters

Template.sampleGroupExprVarFilters.onCreated(function(){
  this.subscribe("jobsOfType", "ApplyExprAndVarianceFilters");
});

Template.sampleGroupExprVarFilters.helpers({
  // Have the expression&variance filters been applied
  // to this sample group?
  exprVarFilterApplied(){
    // ie, is there an associated blobs2
    // with the appropriate name
    // for this sample group
    return false; // TODO
  },

  // if there is a job currently processing or waiting, return its status;
  // else return false
  exprVarFilterProcessing(){
    let self = this;

    console.log("checking for jobs with", self._id); // XXX
  
    let currentJob = Jobs.findOne({
      '$and': [
        {name: "ApplyExprAndVarianceFilters"},
        {status: {$in: ["creating", "waiting", "running"]}}, // TODO remove done
        {'args.sample_group_id': self._id},
      ],
    },);
    console.log("found job", currentJob); // XXX
    if(currentJob){ return currentJob.status; } else { return false; }
  },

});

Template.sampleGroupExprVarFilters.events({
  // initiate the expression & variance filter job 
  "click .button.run-job": function(event, instance){
    let sampleGroupId = instance.data._id ;
    console.log("about to run the job for expr var filter", sampleGroupId); // XXX 
    // TODO anything else before calling the method?
    Meteor.call("applyExprVarianceFilters", sampleGroupId, (error, result) => {
      if(error){
        // TODO recover? throw?
      } else {
        console.log("called meteor method and got result", result); // XXX
        // TODO handle result
      }
    });
  }
});

// Template.waitAndThenPermissionDenied

Template.waitAndThenPermissionDenied.onCreated(function() {
  let instance = this;

  instance.waitForTheServer = new ReactiveVar(true);

  instance.timeoutHandle = Meteor.setTimeout(() => {
    instance.waitForTheServer.set(false);
  }, 15 * 1000);
});

Template.waitAndThenPermissionDenied.events({
  "click .skip-wait"(event, instance) {
    Meteor.clearTimeout(instance.timeoutHandle);

    instance.waitForTheServer.set(false);
  },
});
