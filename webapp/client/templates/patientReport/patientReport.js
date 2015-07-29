Template.kinaseSignatures.helpers({
  getSignatures: function (number) {
    // db.getCollection('cohort signatures').distinct("description", {"description": {$regex: /kinase/}})
    return [
      "MAPK11",
      "MAPK14",
      "MAPK1",
      "MAPK3",
      "MAPK7",
      "MAPK8",
      "MAPK9",
      "MAPKAPK2",
      "MTOR",
      "PAK1",
      "PDPK1",
      "PIM1",
      "PLK1",
      "PLK3",
      "PRKAA1",
      "PRKAA2",
      "PRKACA",
      "PRKCA",
    ]
  },
  randomBoxplotUrl: function () {
    var urls = [
      "/images/boxplot_first.png",
      "/images/boxplot_second.png",
      "/images/boxplot_third.png",
    ];
    return urls[Math.floor(Math.random() * urls.length)];
  }
});

Template.tfSignatures.helpers({
  getSignatures: function (number) {
    // db.getCollection('cohort signatures').distinct("description", {"description": {$regex: /kinase/}})
    return [
      "SREBF2",
      "SRF",
      "STAT1",
      "STAT2",
      "STAT3",
      "STAT5B",
      "STAT5A",
      "STAT4",
      "ABL1",
      "AHR",
      "AIF1L",
      "ARNT",
      "ARVCF",
    ]
  },
  randomBoxplotUrl: function () {
    var urls = [
      "/images/boxplot_first.png",
      "/images/boxplot_second.png",
      "/images/boxplot_third.png",
    ];
    return urls[Math.floor(Math.random() * urls.length)];
  }
});
