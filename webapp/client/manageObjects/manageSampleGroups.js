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

// Subscribe to associated jobs & blobs
Template.sampleGroupExprVarFilters.onCreated(function(){
  let instance = this;
  let sampleGroupId = instance.data._id ;
  // use Template.subscriptionsReady to know when these are available
  instance.subscribe("sampleGroupFilterJobs", sampleGroupId);
  instance.subscribe("blobsAssociatedWithObject", "SampleGroups", sampleGroupId);
});

Template.sampleGroupExprVarFilters.helpers({

  // if a filter has been applied, the download URL for the
  // filtered data; otherwise, 'false'
  urlForFilteredData(){
    let foundBlob = Blobs2.findOne({
      "associated_object.collection_name":"SampleGroups",
      "associated_object.mongo_id":this._id,
      "metadata.type":"ExprAndVarFilteredSampleGroupData",
    });

    if(!foundBlob){return false;}
    // Construct the URL a la downloadUrl above

    // Use the samplegroup name to make a custom download
    // filename. Url encode it since it will be going into a path
    let sampleGroupName = encodeURIComponent(this.name);
    let visibleFileName = `${sampleGroupName}.genes_filtered.tsv`;
    let userId = Meteor.userId();
    let loginToken = Accounts._storedLoginToken();


    let url = `/download/${userId}/${loginToken}/blob/` +
        `${foundBlob._id}/${visibleFileName}`;
    return url;
  },

  // if there is a job currently processing or waiting, return its status;
  // else return false
  isJobRunning(){
    return getFilterJobStatus(this._id);
  },
  // did the job error out
  didJobFail(){
    return ( getFilterJobStatus(this._id) === "error" );
  }
});
// helper for isJobRunning & didJobFail above
// heavily depends on there only ever being 1 job per sample group
// as it will pick an arbitrary one
function getFilterJobStatus(sampleGroupId){
    let currentJob = Jobs.findOne({
      '$and': [
        {name: "ApplyExprAndVarianceFilters"},
        {status: {$in: ["creating", "waiting", "running","error"]}},
        {'args.sample_group_id': sampleGroupId},
      ],
    },);
    if(currentJob){ return currentJob.status; } else { return false; }
}

Template.sampleGroupExprVarFilters.events({
  // initiate the expression & variance filter job
  "click .button.run-job": function(event, instance){
    let sampleGroupId = instance.data._id ;
    Meteor.call("applyExprVarianceFilters", sampleGroupId, (error, result) => {
      if(error){
        console.log("error:", error);
        if (!error.details) {
          instance.error.set({
            header: "Internal server error",
            message: error.reason || "Error: " + error.error,
          });
        } else {
          instance.error.set({
            header: error.reason,
            message: error.details
          });
        }
      }
      // No action needed if call succeeds.
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
