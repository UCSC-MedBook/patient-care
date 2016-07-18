// Template.createDataSet

AutoForm.addHooks("insertDataSet", {
  onSuccess(submitType, selected) {
    FlowRouter.setParams({ selected });
  },
});

Template.createDataSet.helpers({
  nonDataFields() {
    let { metadata_schema } = _.findWhere(MedBook.dataSetTypes, {
      value_type: "gene_expression"
    });

    return new SimpleSchema([
      DataSets.simpleSchema().pick(["name", "description", "value_type"]),
      new SimpleSchema({
        metadata: { type: new SimpleSchema(metadata_schema) }
      })
    ]);
  },
});

// Template.showDataSet

Template.showDataSet.helpers({
  slugToString: MedBook.utility.slugToString,
  downloadUrl() {
    let userId = Meteor.userId();
    let loginToken = Accounts._storedLoginToken();

    return `/download/${userId}/${loginToken}/data-collection/` +
        `DataSets/${this._id}`;
  },
});
