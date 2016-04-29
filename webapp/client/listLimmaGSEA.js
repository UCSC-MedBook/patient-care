// Template.listLimmaGSEA

Template.listLimmaGSEA.onCreated(function () {
  let instance = this;

  instance.subscribe("sampleGroups");
  instance.subscribe("geneSetCollections");

  function makeDefaultGroup (title, name) {
    return {
      title, name,
      customize: new ReactiveVar(false),
      customSampleGroup: new ReactiveVar({
        name: "",
        version: 1,
        collaborations: [ Meteor.user().collaborations.personal ],
        studies: []
      }),
    }
  }
  instance.groupA = makeDefaultGroup("Group A", "sampleGroupA");
  instance.groupB = makeDefaultGroup("Group B", "sampleGroupB");

  instance.error = new ReactiveVar(null); // null = don't show
  instance.creatingJob = new ReactiveVar(false); // spinner on submit button
});

Template.listLimmaGSEA.onRendered(function () {
  let instance = this;

  instance.$(".dropdown.gene-sets-dropdown").dropdown();
});

Template.listLimmaGSEA.helpers({
  groupA: function () { return Template.instance().groupA },
  groupB: function () { return Template.instance().groupB },
  error: function () { return Template.instance().error; },
  creatingJob: function () { return Template.instance().creatingJob.get(); },
  getSampleGroupCollections: function () {
    return GeneSetCollections.find({});
  },
});

function getSampleGroupId (group, instance) {
  if (group.customize.get()) {
    return new Promise((resolve, reject) => {
      let sgObj = group.customSampleGroup.get();

      if (!sgObj.name) {
        reject(Meteor.Error("Name missing",
            `Please enter a name for ${group.title}.`))
        return;
      }
      if (sgObj.studies.length === 0) {
        reject(Meteor.Error("Studies missing",
            `Please add one or more studies to ${group.title}.`));
        return;
      }

      Meteor.call("createSampleGroup", sgObj, (error, result) => {
        if (error) {
          reject(Meteor.Error("Error creating sample group."));
        } else {
          resolve(result);
        }
      });
    });
  } else {
    let sgId = instance.$(`input[name=${group.name}]`).val();
    if (sgId) {
      return Promise.resolve(sgId);
    } else {
      return Promise.reject(new Meteor.Error("No sample group selected.",
          `Please select a sample group for ${group.title}.`));
    }
  }
}

Template.listLimmaGSEA.events({
  "submit form.create-limma-gsea": function (event, instance) {
    event.preventDefault();

    let { groupA, groupB, error } = instance;

    // start the spinner on the submit button, clear previous errors
    instance.creatingJob.set(true);
    instance.error.set(null);

    // NOTE: we need promises so we can make multiple trips to the server

    // store these in variables so that we can remove sample groups that were
    // created during a failed form submit (one failed and the other was fine)
    let groupAPromise = getSampleGroupId(groupA, instance);
    let groupBPromise = getSampleGroupId(groupB, instance);

    Promise.all([ groupAPromise, groupBPromise ])
      .then((values) => {
        let [sample_group_id_a, sample_group_id_b] = values;

        // get the other form variables and make sure they're okay

        let limma_top_genes_count =
            parseInt(instance.$("input[name=limmaTopGenes]").val(), 10);
        let gene_set_collection_id =
            instance.$("input[name=geneSetCollection]").val();
        if (!limma_top_genes_count) {
          throw new Meteor.Error("Invalid top gene count",
              "Please enter the number of genes you'd like Limma to find.");
        }
        if (!gene_set_collection_id) {
          throw new Meteor.Error("No gene sets selected",
              "Please select the gene sets you'd like to use for GSEA");
        }

        // create the job and hope for the best!
        return new Promise((resolve, reject) => {
          Meteor.call("createLimmaGSEA", {
            sample_group_id_a, sample_group_id_b,
            limma_top_genes_count, gene_set_collection_id
          }, (error, result) => {
            if (error) {
              reject(new Meteor.Error("Error creating job",
                  "An internal error prevented this job from being created."));
            } else {
              resolve(result);
            }
          });
        });
      })
      .then((result) => {
        console.log("JOB CREATED:", result);

        // stop the spinner on the submit button
        instance.creatingJob.set(false);
      })
      .catch((error) => {
        // remove sample groups created if the form submit fails and they were
        // creating a new one
        _.each([
          { group: groupA, promise: groupAPromise },
          { group: groupB, promise: groupBPromise },
        ], (groupAndPromise) => {
          if (groupAndPromise.group.customize.get()) {
            console.log("deleting sample group for " +
                groupAndPromise.group.title);

            groupAndPromise.promise
              .then((sampleGroupId) => {
                Meteor.call("removeSampleGroup", sampleGroupId);
              })
              .catch(() => {});
          }
        });

        instance.error.set({
          header: error.error,
          message: error.reason,
        });

        // stop the spinner on the submit button
        instance.creatingJob.set(false);
      });
  },
});



// Template.limmaGSEAGroupSelector

Template.limmaGSEAGroupSelector.onCreated(function () {
  let instance = this;

  _.extend(instance, instance.data.group);
});

Template.limmaGSEAGroupSelector.onRendered(function () {
  let instance = this;

  instance.$(".dropdown").dropdown({
    onChange: function(value, text, $selectedItem) {
      instance.customize.set($selectedItem.data().customize);
    }
  });
});

Template.limmaGSEAGroupSelector.helpers({
  getSampleGroups: function () {
    return SampleGroups.find({});
  },
  customSampleGroup: function () {
    return Template.instance().customSampleGroup;
  },
});
