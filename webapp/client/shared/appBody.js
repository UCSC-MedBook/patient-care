// Template.appBody

Template.appBody.onCreated(function () {
  let instance = this;

  // instance.autorun(function () {
  //   let params = instance.data.params();
  //
  //   if (params.patient_id) {
  //     instance.subscribe("patientLabel", params.patient_id);
  //   }
  // });
});

Template.appBody.onRendered(function () {
  // color the background of the site if not on production
  if (Meteor.settings &&
      Meteor.settings.public.WORLD_URL === "staging.medbook.io") {
    // light green
    $("body").css("background-color", "#F6FFF2");
  } else if (!Meteor.settings ||
      Meteor.settings.public.WORLD_URL !== "medbook.io") {
    // light blue
    $("body").css("background-color", "#F2FCFF");
  }
});

Template.appBody.helpers({
  getPatientLabel: function () {
    let patient = Patients.findOne(this.params().patient_id);
    if (patient) return patient.patient_label;
    return "loading";
  },
  invalidUrl() {
    return FlowRouter.getRouteName() === undefined;
  },
});

// Template.siteBreadcrumbs

Template.siteBreadcrumbs.helpers({
  isJobResult() {
    return [
      "upDownGenesJob",
      "limmaGseaJob",
      "gseaJob",
      "pairedAnalysisJob",
      "limmaJob",
      "singleSampleTopGenesJob",
    ].indexOf(FlowRouter.getRouteName()) !== -1;
  },
});

// Template.chatWithUsOnSlack

Template.chatWithUsOnSlack.helpers({
  directSlackLink() {
    const user = Meteor.user();

    if (!user ||
        !user.profile ||
        !user.profile.patientCare ||
        !user.profile.patientCare.dismissedSlackExplanation) {
      return "";
    }

    return "https://medbook.slack.com";
  },
});

Template.chatWithUsOnSlack.onRendered(() => {
  function setChecked(checkedStatus) {
    Meteor.users.update(Meteor.userId(), {
      $set: {
        "profile.patientCare.dismissedSlackExplanation": checkedStatus
      }
    });
  }

  $(".ui.checkbox.dismiss-slack-explanation").checkbox({
    onChecked() { setChecked(true); },
    onUnchecked() { setChecked(false); },
  });
});

Template.chatWithUsOnSlack.events({
  "click .explain-slack-button"(event, instance) {
    // TODO: be able to not show again
    $(".ui.modal.explain-slack").modal("show");
  },
});

// Template.notificationsMenuItem

Template.notificationsMenuItem.onRendered(function () {
  let instance = this;

  // show the notifications popup
  instance.$("#notifications-activator").popup({
    hoverable: true,
    position: "bottom center",
  });
});

Template.notificationsMenuItem.helpers({
  getNotifications() {
    let now = new Date();

    return [
      {
        type: "share",
        date_created: new Date().setDate(now.getDate() - 1),
        href: "https://medbook.io/",
        content: "<b>Ted Goldstein</b> shared a gene set with you: " +
            "<b>Cool genes</b>",
      },
    ];
  },
  getIconClass() {
    if (this.type === "share") {
      return "share";
    } else {
      // default to alarm icon
      return "alarm";
    }
  },
});
