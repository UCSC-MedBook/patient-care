Template.registerHelper("print", function (object) {
  console.log(object);
});

Template.registerHelper('keyValue', function(context, options) {
  var result = [];
  _.each(context, function(value, key, list) {
    result.push({key:key, value:value});
  })
  return result;
});
