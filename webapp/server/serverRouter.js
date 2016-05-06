Picker.route("/tools/gsea-result/:job_id/:file_path",
    function(params, req, res, next) {
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
