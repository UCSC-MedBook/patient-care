Template.visualizeSchema.helpers({
  getSchemas: function () {
    // create an array, fill up the array, return the array
    var topLevelSchemas = Schemas.topLevel;
    var schemaArray = [];
    for (var schemaName in topLevelSchemas) {
      schemaArray.push({
        "schemaName": schemaName,
        "schemaObject": topLevelSchemas[schemaName]
      });
    }
    return schemaArray;
  },

});
