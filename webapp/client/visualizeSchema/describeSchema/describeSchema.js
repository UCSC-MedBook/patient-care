Template.describeSchema.helpers({
  getSchemaSpecifics: function (schemaObject) {
    console.log("==================");
    console.log(schemaObject);

    schemaSpecifics = [];

    schemaArray = schemaObject._schema;
    for (var current in schemaArray) {
      // does this loop need protection with hasOwnProperty()?
      if (current && schemaArray.hasOwnProperty(current)) {
        console.log("current: " + current);
        console.log(schemaObject._schema[current]);
        type = schemaObject._schema[current].type;
        fullString = type.toString();
        firstPartLength = "function ".length
        typeString = fullString.substring(firstPartLength, fullString.indexOf("("/*)*/) - firstPartLength);
        schemaSpecifics.push({
          "name": current,
          "type": type,
          "typeString": typeString,
          "optional": schemaObject._schema[current].optional
        });
      }
    }

    console.log(schemaSpecifics);
    return schemaSpecifics;
  }
});
