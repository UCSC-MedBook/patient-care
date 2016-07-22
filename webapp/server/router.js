fs = Npm.require("fs");
path = Npm.require('path');
spawn = Npm.require('child_process').spawn;
ntemp = Meteor.npmRequire('temp').track();

// Route for downloading blobs2 by job filename & blob filename
// Used in Limma/GSEA results which output several HTML files
// that contain relative links; indexing by only blob filename
// allows seamless "online" navigation between these files.
Picker.route("/download/:userId/:loginToken/" +
    "job-blob/:jobId/:file_name",
    function(params, req, res, next) {
  // security
  let { userId, loginToken, jobId, file_name } = params;
  let hashedToken = Accounts._hashLoginToken(loginToken);

  const user = MedBook.findUser({
    _id: userId,
    "services.resume.loginTokens.hashedToken": hashedToken,
  });

  let job = Jobs.findOne(jobId);
  if (!user || !user.hasAccess(job)) {
    res.writeHead(403);
    res.write("Permission denied\n");
    res.end();
    return;
  }

  let blob = Blobs2.findOne({
    "associated_object.collection_name": "Jobs",
    "associated_object.mongo_id": jobId,
    file_name: file_name
  });
  if (!blob) {
    res.writeHead(404);
    res.write('404 Not Found\n');
    res.end();
    return;
  }

  res.setHeader("Content-Type", blob.mime_type);
  // don't seem to need Content-Disposition header here
  res.writeHead(200);

  var path = blob.getFilePath();
  fs.createReadStream(path).pipe(res);

  return;
});

function permissionDenied (res) {
  res.writeHead(403);
  res.write("Permission denied\n");
  res.end();
  return;
}

// this will send down a .tsv containing genomic information in
// a data set or a sample group
Picker.route("/download/:userId/:loginToken/" +
    "data-collection/:collectionName/:mongoId/",
    function(params, req, res, next) {

  let { userId, loginToken, collectionName, mongoId } = params;

  // make sure it's a user
  let hashedToken = Accounts._hashLoginToken(loginToken);
  const user = MedBook.findUser({
    _id: userId,
    "services.resume.loginTokens.hashedToken": hashedToken,
  });
  if (!user) return permissionDenied(res);

  // make sure it's not a random collection and also figure out the first
  // argument with which to call the export command
  let exportFirstArg;
  if (collectionName === "DataSets") {
    exportFirstArg = "--data_set_id";
  } else if (collectionName === "SampleGroups") {
    exportFirstArg = "--sample_group_id";
  } else {
    return permissionDenied(res);
  }

  // make sure they have access
  let object = MedBook.collections[collectionName].findOne(mongoId);
  if (!user.hasAccess(object)) return permissionDenied(res);

  // they made it! now send them the file
  res.setHeader("Content-Type", "text/tab-separated-values");
  res.setHeader("Content-Disposition",
      `attachment; filename="${object.name}.tsv"`);
  res.writeHead(200);

  let cwd = ntemp.mkdirSync("DownloadData");
  let logfilePath = path.join(cwd, "stderr.txt");
  let stderrStream = fs.createWriteStream(logfilePath, {flags: "a"});

  // spawn the python exporter and pipe the output to the user
  let child = spawn(Meteor.settings.genomic_expression_export, [
    exportFirstArg, mongoId
  ], { cwd: cwd });

  child.stderr.pipe(stderrStream);
  child.stdout.pipe(res);

  return;
});
