// Template.limmaGSEAJob

Template.limmaGSEAJob.onCreated(function () {
  let instance = this;

  instance.subscribe("limmaGSEAJob", instance.data.job_id);
});

Template.limmaGSEAJob.helpers({
  getJob() {
    return Jobs.findOne(Template.instance().data.job_id);
  },
});
