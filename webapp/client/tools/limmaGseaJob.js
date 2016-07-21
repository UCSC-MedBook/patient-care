// Template.limmaGseaJob

Template.limmaGseaJob.onCreated(function () {
  let instance = this;

  // subscribe and keep up to date
  instance.autorun(function () {
    instance.subscribe("specificJob", Template.currentData().job_id);
  });
});

Template.limmaGseaJob.helpers({
  getJobResultUrl: function() {
    let userId = Meteor.userId();
    let loginToken = Accounts._storedLoginToken();
    let jobId = FlowRouter.getParam("job_id");

    return `/download/${userId}/${loginToken}/job-blob/${jobId}/index.html`;
  },
});

Template.limmaGseaJob.events({
  "click .gsea-iframe-new-tab"(event, instance) {
    // open the current iFrame URL in a new tab: magic!
    window.open($("#gsea-report").contents().get(0).location.href,'_blank');
  },
});
