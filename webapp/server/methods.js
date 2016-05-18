Meteor.methods({
  createTumorMapBookmark: function (data_set_id, sample_label, mapLabel) {
    // TODO: check if mapLabel is valid?
    check([data_set_id, sample_label, mapLabel], [String]);

    var user = MedBook.ensureUser(this.userId);
    let study = DataSets.findOne(data_set_id);
    user.ensureAccess(study);

    // don't *need* to call referentialIntegrity, but we'll be safe
    MedBook.referentialIntegrity.dataSets_expression3(data_set_id);
    let sampleIndex = study.gene_expression_index[sample_label];

    console.log("loading data");
    let sampleExpressionData = {};
    Expression3.find({ data_set_id }).forEach((doc) => {
      sampleExpressionData[doc.gene_label] = doc.rsem_quan_log2[sampleIndex];
    });

    console.log("done");

    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    apiResponse = HTTP.call("POST",
        "https://tumormap.ucsc.edu:8343/query/overlayNodes", {
      data: {
        map: "CKCC/v1",
        layout: "mRNA",
        nodes: {
          [sample_label]: sampleExpressionData,
        }
      }
    });

    if (apiResponse.statusCode === 200) {
      Samples.update({ data_set_id, sample_label }, {
        $set: {
          [ "tumor_map_bookmarks." + mapLabel ]: apiResponse.data.bookmark,
        }
      });
    }
  },
});
