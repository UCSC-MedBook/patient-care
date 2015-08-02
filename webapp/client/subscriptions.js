// allows quick linking between patient reports
Session.setDefault("metadataReady", false);

Meteor.subscribe("ReportMetadata", function () {
  Session.set("metadataReady", true);
  console.log("loaded ReportMetadata subscription");
});
