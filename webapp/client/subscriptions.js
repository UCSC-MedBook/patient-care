// allows quick linking between patient reports
Session.setDefault("metadataReady", false);

Meteor.subscribe("PatientReportMetadata", function () {
  Session.set("metadataReady", true);
  console.log("metadataReady");
});

console.log("resubscribe")
