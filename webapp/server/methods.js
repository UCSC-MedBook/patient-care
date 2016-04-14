Meteor.methods({
  createTumorMapBookmark: function (study_label, sample_label, mapLabel) {
    // TODO: check if mapLabel is valid?
    check([study_label, sample_label, mapLabel], [String]);

    var user = MedBook.ensureUser(this.userId);
    let study = Studies.findOne({id: study_label});
    user.ensureAccess(study);

    // don't *need* to call referentialIntegrity, but we'll be safe
    MedBook.referentialIntegrity.studies_expression3({ id: study_label });
    let sampleIndex = study.gene_expression_index[sample_label];

    let sampleExpressionData = {};
    Expression3.find({ study_label }).forEach((doc) => {
      sampleExpressionData[doc.gene_label] = doc.rsem_quan_log2[sampleIndex];
    });

    console.log("done");

    apiResponse = HTTP.call("POST", "http://hexmap.sdsc.edu:8111/query/overlayNodes", {
      data: {
        map: "CKCC/v1",
        layout: "mRNA",
        nodes: {
          [sample_label]: sampleExpressionData,
        }
      }
    });
    console.log("apiResponse:", apiResponse);

    // let setObj = {
    //   [ "tumor_map_bookmarks." + mapLabel ]: bookmark,
    // };
    //
    // Samples.update({ study_label, sample_label }, {
    //   $set: setObj
    // });
  },
});
