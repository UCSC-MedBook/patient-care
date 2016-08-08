// Template.showGeneSetGroup

Template.showGeneSetGroup.onCreated(function () {
  let instance = this;

  instance.subscribe("geneSetsForGroup", instance.data._id);
});

Template.showGeneSetGroup.helpers({
  getGeneSets() {
    return GeneSets.find();
  },
  joinedGenes() {
    return this.gene_labels.join(", ");
  }
});
