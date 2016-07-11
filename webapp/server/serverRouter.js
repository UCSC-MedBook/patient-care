fs = Npm.require("fs");

// Picker.route("/tools/:userId/:loginToken/limma-gsea/:job_id/:file_name",
Picker.route("/tools/limma-gsea/:job_id/:file_name", // FIXME
    function(params, req, res, next) {
  // let hashedToken = Accounts._hashLoginToken(loginToken);
  //
  // const user = Meteor.users.find({
  //   _id: userId,
  //   "services.resume.loginTokens.hashedToken": hashedToken,
  // });
  //
  // let user = MedBook.findUser(user._id);
  // let job = Jobs.findOne(params.job_id);
  // user.ensureAccess(job);

  let blob = Blobs2.findOne({
    "associated_object.collection_name": "Jobs",
    "associated_object.mongo_id": params.job_id,
    file_name: params.file_name
  });

  if (!blob) {
    res.write('404 Not Found\n');
    res.end();
    return;
  }

  res.setHeader("Content-Type", blob.mime_type);
  res.writeHead(200);

  var path = blob.getFilePath();
  fs.createReadStream(path).pipe(res);

  return;
});
