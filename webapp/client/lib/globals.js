// set the default AutoForm template to Semantic UI
Meteor.startup(() => {
  AutoForm.setDefaultTemplate("semanticUI");
});

Template.registerHelper("firstGreater", function (first, second) {
  return first > second;
});

Template.registerHelper("concat", function (first, second) {
  return first + second;
});

Template.registerHelper("or", function (first, second) {
  return first || second;
});

Template.registerHelper("threeOr", function (first, second, third) {
  return first || second || third;
});
