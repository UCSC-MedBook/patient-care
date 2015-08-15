userProfile = function () {
  if (Meteor.user()) {
    return Meteor.user().profile;
  } else {
    return null;
  }
};
