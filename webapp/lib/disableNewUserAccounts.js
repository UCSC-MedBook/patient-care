// disable on the client
Accounts.config({
  forbidClientAccountCreation: true
});

// just in case there's something that calls new user code somewhere
// on the server
if (Meteor.isServer) {
  Accounts.validateNewUser(function () {
    return false;
  });
}
