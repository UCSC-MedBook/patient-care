contactTeoText =
`<a href="mailto:mokolodi1@gmail.com?subject=PatientCare%20bug" class="ui button teal">
  <i class="bug icon"></i>
  Contact Teo
</a>`;
Template.registerHelper("contactTeoText", contactTeoText);

Meteor.startup(() => {
  AutoForm.setDefaultTemplate("semanticUI");
});

Template.registerHelper("firstGreater", function (first, second) {
  return first > second;
});
