Template.showPatient.helpers({
  patientId: function() {
    console.log("patientId: " + this.patientId)
    console.log("currentPatient: ");
    console.log(this.currentPatient);
    return this.patientId;
  }
});
