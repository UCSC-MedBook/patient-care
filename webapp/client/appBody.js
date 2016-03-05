// Template.appBody

Template.appBody.onCreated(function () {
  let instance = this;

  // keep track of whether the study has loaded so that we can tell if it's
  // invalid or not
  instance.studySubscription = new ReactiveVar(null);

  // subscribe to the study to do the join on sample_label
  instance.autorun(function () {
    let study_label = Template.currentData().params().study_label;
    if (study_label) {
      instance.studySubscription.set(instance.subscribe("study", study_label));
    } else {
      instance.studySubscription.set(null);
    }
  });
});

Template.appBody.helpers({
  getShortName: function () {
    const { study_label } = Template.currentData().params();
    const study = Studies.findOne({ study_label });
    if (study) {
      return study.short_name;
    }

    // check if the study subscription is ready but the study still doesn't
    // exist, which would mean the sample_label is invalid
    if (Template.instance().studySubscription.get().ready()) {
      return "invalid study";
    }

    return "loading";
  },
});
