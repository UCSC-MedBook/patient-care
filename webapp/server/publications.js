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
    id: study_label,
    collaborations: {$in: user.getCollaborations() },
  });
});

Meteor.publish("patientSamples", function (study_label, patient_label) {
  check([study_label, patient_label], [String]);

  var user = MedBook.ensureUser(this.userId);
  var study = Studies.findOne({id: study_label});
  user.ensureAccess(study);

  var cursor = Samples.find({
    study_label,
    patient_label,
  });

  // if the samples don't exist for the patient, create them
  var asArray = cursor.fetch();
  var sample_labels = _.pluck(asArray, "sample_label");
  var patient = _.findWhere(study.patients, { patient_label });
  if (!patient) {
    this.ready();
    return;
  }

  _.each(patient.sample_labels, (sample_label) => {
    if (sample_labels.indexOf(sample_label) === -1) {
      Samples.insert({
        study_label,
        patient_label,
        sample_label
      });
    }
  });

  return cursor;
});
