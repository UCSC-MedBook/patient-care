// Template.showGeneSetGroup

Template.showGeneSetGroup.onRendered(function () {
  let instance = this;

  // keep track of which things we've subscribed to
  // Normally we don't have to do this because it's within an autorun,
  // but here there's no autorun, and it's not worth it to go to the server
  // more than once if the subscription is still active.
  let subscribedIndexes = {};

  instance.$(".ui.accordion").accordion({
    exclusive: false,

    // make the transition faster
    duration: 100,

    // subscribe to the gene set that they want to look at
    onOpening() {
      let index = (this.index() - 1) / 2;

      if (!subscribedIndexes[index]) {
        instance.subscribe("geneSetInGroup", instance.data._id, index);
        subscribedIndexes[index] = true;
      }
    },
  });
});

Template.showGeneSetGroup.helpers({
  getGeneSet() {
    return GeneSets.findOne({
      name: this.toString(),
      gene_set_group_id: Template.instance().data._id
    });
  },
  joinedGenes(geneSet) {
    return geneSet.gene_labels.join(", ");
  },
  isUrl(string) {
    // true if it starts with "http" and doesn't have any whitespace
    return string.startsWith("http") && !/\s/.test(string);
  },
});
