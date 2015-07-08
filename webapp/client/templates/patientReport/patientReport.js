Template.patientReport.helpers({
  getCurrentDay: function () {
    var currentDate = new Date(); // this is not reactive
    return Math.ceil((currentDate - this.on_study_date) / (1000*60*60*24));
  },

});

Template.sampleReport.helpers({
  stuff: function (parameter) {
    //console.log(parameter);
  }
});
