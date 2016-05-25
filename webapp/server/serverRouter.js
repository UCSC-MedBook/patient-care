// Picker.route("/tools/:userId/:loginToken/gsea-result/:job_id/:file_path",
Picker.route("/tools/gsea-result/:job_id/:file_path",
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

  let blob = Blobs.findOne({
    "metadata.job_id": params.job_id,
    "metadata.tool_label": "gsea",
    "metadata.file_path": params.file_path
  });

  if (!blob) {
    res.write('404 Not Found\n');
    res.end();
    return;
  }

  let blobReadStream = blob.createReadStream();
  blobReadStream.pipe(res);
  return;
});
