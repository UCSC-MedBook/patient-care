// Template.manageObjects

var managableTypes = [
  {
    collectionSlug: "data-sets",
    humanName: "Data Sets",
    singularName: "data set",
    collectionName: "DataSets",
    introTemplate: "introDataSets",
    createTemplate: "createDataSet",
    showTemplate: "showDataSet",
  },
  {
    collectionSlug: "sample-groups",
    humanName: "Sample Groups",
    singularName: "sample group",
    collectionName: "SampleGroups",
    introTemplate: "introSampleGroups",
    createTemplate: "createSampleGroup",
    showTemplate: "showSampleGroup",
    permissionDeniedTemplate: "waitAndThenPermissionDenied",
  },
  {
    collectionSlug: "gene-set-groups",
    humanName: "Gene Set Groups",
    singularName: "gene set group",
    collectionName: "GeneSetCollections",
    introTemplate: "introGeneSetGroups",
    createTemplate: "createGeneSetGroup",
    showTemplate: "showGeneSetGroup",
  },
  {
    collectionSlug: "studies",
    humanName: "Studies",
    singularName: "study",
    collectionName: "Studies",
    introTemplate: "introStudies",
    createTemplate: "createStudy",
    showTemplate: "showStudy",
  },
  {
    collectionSlug: "clinical-forms",
    humanName: "Clinical Forms",
    singularName: "clinical form",
    collectionName: "Forms",
    introTemplate: "introForms",
    createTemplate: "createForm",
    showTemplate: "showForm",
  },
];

Template.manageObjects.onRendered(function () {
  let instance = this;

  // instance.autorun(() => {
  //   FlowRouter.getParam("collectionSlug");
  // });
  instance.$(".help.circle.icon").popup({
    position: "bottom left",
  });
});

Template.manageObjects.helpers({
  managableTypes: managableTypes,
  tabActive() {
    return this.collectionSlug === FlowRouter.getParam("collectionSlug");
  },
  selectedType() {
    let selected = FlowRouter.getParam("collectionSlug");

    return _.findWhere(managableTypes, { collectionSlug: selected });
  },
});

// Template.manageObjectsGrid

Template.manageObjectsGrid.onCreated(function () {
  let instance = this;

  instance.currentObject = new ReactiveVar();

  // subscribe to the names of the available data
  instance.autorun(() => {
    let slug = FlowRouter.getParam("collectionSlug");
    let currObj = _.findWhere(managableTypes, { collectionSlug: slug });

    instance.currentObject.set(currObj);
    instance.subscribe("allOfCollectionOnlyName", currObj.collectionName);
  });

  // if the user selected something before, select that one
  var lastSlug;

  instance.autorun((computation) => {
    let selected = FlowRouter.getParam("selected");
    let collectionSlug = FlowRouter.getParam("collectionSlug");

    if (lastSlug !== collectionSlug && !selected) {
      let fromSession = Session.get("manageObjects-" + collectionSlug);

      // Only execute after a bit because of a race condition between
      // this firing and the URL actually getting set.
      // (FlowRouter.getParam("selected") works fine but the URL is wrong)
      Meteor.defer(() => {
        FlowRouter.setParams({
          selected: fromSession
        });
      });
    } else {
      Session.set("manageObjects-" + collectionSlug, selected);
    }

    lastSlug = collectionSlug;
  });
});

function getObjects () {
  // get all the objects for this data type
  let slug = FlowRouter.getParam("collectionSlug");
  let managing = _.findWhere(managableTypes, { collectionSlug: slug });

  return MedBook.collections[managing.collectionName].find({}, {
    // need to sort by _id also to break ties: if two things have the same
    // name, clicking on one can cause the list to reorder itself
    sort: { name: 1, _id: 1 },
  });
}

Template.manageObjectsGrid.helpers({
  getObjects,
  managingObject() {
    return this._id === FlowRouter.getParam("selected");
  },
});

// Template.manageObject

Template.manageObject.onCreated(function () {
  let instance = this;

  // subscribe to the selected object
  instance.autorun(() => {
    let { collectionName } = instance.data;
    let selectedId = FlowRouter.getParam("selected");

    if (selectedId) {
      instance.subscribe("objectFromCollection", collectionName, selectedId);
    }
  });
});

Template.manageObject.helpers({
  getObjects,
  getObject() {
    let slug = FlowRouter.getParam("collectionSlug");
    let managing = _.findWhere(managableTypes, { collectionSlug: slug });
    let selectedId = FlowRouter.getParam("selected");

    return MedBook.collections[managing.collectionName].findOne(selectedId);
  },
  onDelete() {
    return () => {
      FlowRouter.setParams({ selected: null });
    };
  },
});
