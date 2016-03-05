Meteor.publish("studies", function () {
  var user = MedBook.ensureUser(this.userId);

  return Studies.find({
    collaborations: {$in: user.getCollaborations() },
  });
});

Meteor.publish("study", function (study_label) {
  check(study_label, String);
  var user = MedBook.ensureUser(this.userId);

  return Studies.find({
    study_label,
    collaborations: {$in: user.getCollaborations() },
  });
});

Meteor.publish("patientSamples", function (study_label, patient_label) {
  check([study_label, patient_label], [String]);

  var user = MedBook.ensureUser(this.userId);
  user.ensureAccess(Studies.findOne({study_label}));

  return Samples.find({
    study_label,
    patient_label,
  });
});
