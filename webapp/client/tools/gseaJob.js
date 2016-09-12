// Template.gseaJob

Template.gseaJob.onCreated(function () {
  let instance = this;

  // subscribe and keep up to date
  instance.autorun(function () {
    instance.subscribe("specificJob", FlowRouter.getParam("job_id"));
  });
});

Template.gseaJob.helpers({
  getJobResultUrl: function(fileName) {
    let userId = Meteor.userId();
    let loginToken = Accounts._storedLoginToken();
    let jobId = FlowRouter.getParam("job_id");

    return `/download/${userId}/${loginToken}/job-blob/${jobId}/${fileName}`;
  },
  joinedGeneSetGroups() {
    return this.args.gene_set_group_names.join("\n");
  },
});

Template.gseaJob.events({
  "click .gsea-iframe-new-tab"(event, instance) {
    // open the current iFrame URL in a new tab: magic!
    window.open($("#gsea-report").contents().get(0).location.href,'_blank');
  },
});
