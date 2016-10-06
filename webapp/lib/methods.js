Meteor.methods({
    // Takes: data_set_id (string) -- ID of the target data set
    // Finds all Forms that have a Record for at least one sample in
    // the passed data set.

    // Return format
    //     [
    //        {
    //        form_id: ID,
    //        form_name: name of my form,
    //        fields: [
    //                {
    //                  name: field name
    //                  value_type: string etc
    //                  values: [ "value1", "value2",...]
    //                }, ...
    //            ]
    //         }
    //     ]
    //
  getFormsMatchingDataSet: function(data_set_id) {

    //console.log("getting forms for", data_set_id); // XXX

    check(data_set_id, String);

    // Client-side stub:
    if( Meteor.isClient) {
      let stub = [{
          urlencodedId: "placeholder_loadingforms",
          name: "Loading forms...",
          fields: [],
        }];
      return stub;
    }

    // Permissions
    let dataset = DataSets.findOne(data_set_id);
    let user = MedBook.ensureUser(Meteor.userId());
    user.ensureAccess(dataset);

    let formsWithFields = [] ;

    // For each user-accessible form, find records that match our samples
    // if we found any, include the form as an option to pick
    let formsCursor = Forms.find({
      collaborations: { $in: user.getCollaborations() },
      sample_labels: { $in: dataset.sample_labels }
    });

    formsCursor.forEach(function(form){
      // Populate the form field table with its fields
      let encoded_form_id = encodeURIComponent(form._id);
      let sample_label_field = form.sample_label_field ;

      // Set up the fields to be populated with potential values
      // Remove the sample_label_field from the fields because
      // we don't want to be able to query on every individual sample
      let currentFormFields = [];
      for(field of form.fields){
        if(field.name !== sample_label_field){
          field.values = [];  // this is ok -- won't write back to DB
          currentFormFields.push(field);
        }
      }

      // Find all records in that form for our samples
      // and add its values to the values fields.
      // However, don't populate the unique ID fields.
      let fieldsToSkip = ["_id", sample_label_field, "associated_object"];

      let recordsQuery = {
        "associated_object.collection_name": "Forms",
        "associated_object.mongo_id": form._id,
      };

      Records.find(recordsQuery).forEach(function(record){
        for(field in record){
          if (fieldsToSkip.indexOf(field) === -1){

            // Find the form field by index in currentFormFields to update the .values of
            // would use _.findIndex , but our underscore.js isn't new enough :(
            //let fieldIdx = _.findIndex(currentFormFields, function(f){ return f.name === field ; });
            let fieldIdx = -1;
            for(let idx = 0; idx < currentFormFields.length; idx++){
              if(currentFormFields[idx].name === field){
                fieldIdx = idx;
                break;
              }
            }
            // If the desired field exists in the form
            if(fieldIdx >= 0){
              currentFormFields[fieldIdx].values =
                  _.union([record[field]], currentFormFields[fieldIdx].values);
            }
            // console.log("populating", field);
            // console.log("Added ", record[field], "and it's now", currentFormFields);
          }
        }
      });

      // add to the modified form object to return
      formsWithFields.push({
        urlencodedId: encoded_form_id,
        name: form.name,
        fields: currentFormFields
      });
    });

    return formsWithFields ;
  },
  // Takes : data_set_id : data set to source samples from
  //        serialized_query : stringifed JSON Mongo query
  //        form_id -- ID of the form whose fields we're querying on
  getSamplesFromFormFilter: function(data_set_id, serialized_query, form_id){

    check(data_set_id, String);
    check(serialized_query, String);
    check(form_id, String);

    // Don't run client-side.
    if(Meteor.isClient){
      return [];
    }

    // console.log("got form id", form_id);

    let dataset = DataSets.findOne(data_set_id);
    let form = Forms.findOne({_id: form_id});

    // console.log("found form with id", form);

    let samples = dataset.sample_labels;
    let sample_label_field = form.sample_label_field ;

    // Confirm permissions
    let user = MedBook.ensureUser(Meteor.userId());
    user.ensureAccess(dataset);
    user.ensureAccess(form);

    //console.log("Query to be run:", serialized_query); // XXX
    let query = {};
    // Confirm the query parses
    try {
      query = JSON.parse(serialized_query);
    } catch (err) {
      if (err instanceof SyntaxError) {
        console.log("Couldn't parse JSON:", err.message);
        console.log("Tried to parse", serialized_query);
      }
      throw err;
    }

    // Construct the query to reference only records for the chosen form

    let sampleLabelQuery = {};
    sampleLabelQuery[sample_label_field] = {"$in": samples}

    let querySpecificForm = {
      "$and": [
        sampleLabelQuery,
        {
          "associated_object.mongo_id": form._id,
          "associated_object.collection_name": "Forms"
        },
        query,
      ]
    }

    // Run it, return sample IDs.
    let results = Records.find(querySpecificForm).fetch();
    let foundSamples = _.pluck(results, sample_label_field);

    return foundSamples;
  },

  getSampleGroupVersion: function (name) {
    check(name, String);

    // return the next version given the sample group name
    // NOTE: this function only looks at the sample groups this user has
    // access to, which means sample groups are not necessarily uniquely
    // identifiable by { name, version }.

    let user = MedBook.ensureUser(Meteor.userId());

    let latestSampleGroup = SampleGroups.findOne({
      name,
      collaborations: { $in: user.getCollaborations() },
    }, { sort: { version: -1 } });

    if (latestSampleGroup) {
      return latestSampleGroup.version + 1
    }

    return 1; // default value
  },

  removeSampleGroup: function (sampleGroupId) {
    check(sampleGroupId, String);

    let user = MedBook.ensureUser(Meteor.userId());
    user.ensureAccess(SampleGroups.findOne(sampleGroupId));

    SampleGroups.remove(sampleGroupId);
  },

  // jobs
  createGsea: function (args) {
    check(args, new SimpleSchema({
      gene_set_id: { type: String },
      gene_set_sort_field: { type: String },
      gene_set_group_ids: { type: [String] },
      set_max: { type: Number },
      set_min: { type: Number },
      plot_top_x: { type: Number, min: 0 },
      nperm: { type: Number, min: 0 },
      metric: { type: String },
      scoring_scheme: { type: String },
    }));

    let user = MedBook.ensureUser(Meteor.userId());

    // ensure access for gene_set_id
    let geneSet = GeneSets.findOne(args.gene_set_id);
    user.ensureAccess(geneSet);

    // ensure access for gene_set_group_id
    // Don't do this on the client because collaborations aren't necessarily
    // loaded client-side.
    if (Meteor.isServer) {
      // NOTE: this will also fail if the gene_set_group_ids aren't unique
      let accessableGSGCount = GeneSetGroups.find({
        _id: { $in: args.gene_set_group_ids },
        collaborations: { $in: user.getCollaborations() },
      }).count();

      if (accessableGSGCount !== args.gene_set_group_ids.length) {
        throw new Meteor.Error("invalid-gene-set-group-ids");
      }
    }

    // validate gene_set_sort_field (make sure it exists in the gene set)
    let sortField = _.findWhere(geneSet.fields, {
      name: args.gene_set_sort_field,
    });
    if (!sortField) {
      throw new Meteor.Error("gene-set-sort-field-invalid");
    }

    // set a bunch of denormalization args
    args.gene_set_name = geneSet.name;
    args.gene_set_associated_object = geneSet.associated_object;
    args.gene_set_group_names = _.map(args.gene_set_group_ids, (gsgId) => {
      // NOTE: we have to do this as a findOne to preserve the order of the
      // gene sets because they're not sorted by anything
      return GeneSetGroups.findOne(gsgId).name;
    });

    return Jobs.insert({
      name: "RunGSEA",
      status: "waiting",
      user_id: user._id,
      collaborations: [ user.personalCollaboration() ],
      args
    });
  },
  createPairedAnalysis(args) {
    check(args, new SimpleSchema({
      data_set_id: { type: String, label: "Data set" },
      primary_sample_labels: { type: [ String ] },
      progression_sample_labels: { type: [ String ] },
    }));

    let user = MedBook.ensureUser(Meteor.userId());

    let dataSet = DataSets.findOne(args.data_set_id);
    user.ensureAccess(dataSet);

    args.data_set_name = dataSet.name;

    return Jobs.insert({
      name: "RunPairedAnalysis",
      status: "waiting",
      user_id: user._id,
      collaborations: [ user.personalCollaboration() ],
      args
    });
  },
  createSingleSampleTopGenes(args) {
    check(args, new SimpleSchema({
      data_set_id: { type: String },
      sample_labels: { type: [String]},
      percent_or_count: {
        type: String,
        allowedValues: [
          "percent",
          "count",
        ],
      },
      top_percent: {
        type: Number,
        optional: true,
        min: .0001,
        max: 100,
        decimal: true,
      },
      top_count: { type: Number, optional: true, min: 1 },
    }));

    // make they've specified the necessary one
    // It's not a problem if they specify both because it'll be ignored.
    if (args.percent_or_count === "percent") {
      // can't use Match becuase it doesn't do decimals
      if (!args.top_percent) {
        throw new Meteor.Error("must-provide-top-percent");
      }
    } else if (args.percent_or_count === "count") {
      check(args.top_count, Number);
    }

    let user = MedBook.ensureUser(Meteor.userId());

    let dataSet = DataSets.findOne(args.data_set_id);
    user.ensureAccess(dataSet);

    args.data_set_name = dataSet.name;

    let sampleLabels = args.sample_labels;
    delete args.sample_labels;

    return _.map(sampleLabels, (sample_label) => {
      // will override previous values
      args.sample_label = sample_label;

      return Jobs.insert({
        name: "RunSingleSampleTopGenes",
        status: "waiting",
        user_id: user._id,
        collaborations: [ user.personalCollaboration() ],
        args
      });
    });
  },
  createLimma(args) {
    check(args, new SimpleSchema({
      // No allowed values for value_type becuase we check if the value_types
      // of the sample groups match this, and those have allowedValues on
      // insert.
      value_type: { type: String },

      experimental_sample_group_id: { type: String },
      reference_sample_group_id: { type: String },
      top_genes_count: { type: Number, min: 1 },
    }));

    // ensure access to all of the things
    let user = MedBook.ensureUser(Meteor.userId());

    let experimental = SampleGroups.findOne(args.experimental_sample_group_id);
    let reference = SampleGroups.findOne(args.reference_sample_group_id);
    user.ensureAccess(experimental);
    user.ensureAccess(reference);

    // TODO: make sure the groups don't share samples from the same data set

    // make sure the sample groups match the value type
    function ensureValueType (sampleGroup) {
      if (sampleGroup.value_type !== args.value_type) {
        throw new Meteor.Error("value-type-mismatch");
      }
    }
    ensureValueType(experimental);
    ensureValueType(reference);

    // set denormalized args
    args.experimental_sample_group_name = experimental.name;
    args.reference_sample_group_name = reference.name;
    args.experimental_sample_group_version = experimental.version;
    args.reference_sample_group_version = reference.version;

    // insert the job
    return Jobs.insert({
      name: "RunLimma",
      status: "waiting",
      user_id: user._id,
      collaborations: [ user.personalCollaboration() ],
      args,
    });
  },
  createLimmaGSEA: function (args) {
    check(args, new SimpleSchema({
      sample_group_a_id: { type: String },
      sample_group_b_id: { type: String },
      limma_top_genes_count: { type: Number, min: 1 },
      gene_set_group_id: { type: String },
    }));

    let user = MedBook.ensureUser(Meteor.userId());

    let geneSetColl = GeneSetGroups.findOne(args.gene_set_group_id);
    user.ensureAccess(geneSetColl);

    // ensure access to sample group, data sets inside
    _.each([
      args.sample_group_a_id,
      args.sample_group_b_id
    ], (sampleGroupId) => {
      let sampleGroup = SampleGroups.findOne(sampleGroupId);
      user.ensureAccess(sampleGroup);

      // data sets not necessarily loaded on client
      if (Meteor.isServer) {
        _.each(sampleGroup.data_sets, (dataSet) => {
          user.ensureAccess(DataSets.findOne(dataSet.data_set_id));
        });
      }
    });

    // add the sample group names in there to make joins on the client easy
    // TODO: don't do to SampleGroups.findOne()s
    _.extend(args, {
      sample_group_a_name: SampleGroups.findOne(args.sample_group_a_id).name,
      sample_group_b_name: SampleGroups.findOne(args.sample_group_b_id).name,
      gene_set_group_name: geneSetColl.name,
    });

    // if it's been run before return that
    let duplicateJob = Jobs.findOne({ args });
    if (duplicateJob) {
      return duplicateJob._id;
    }

    return Jobs.insert({
      name: "RunLimmaGSEA",
      status: "waiting",
      user_id: user._id,
      collaborations: [ user.personalCollaboration() ],
      args,
    });
  },
  createTumorMapOverlay(args) {
    check(args, MedBook.jobSchemas.TumorMapOverlay.args);

    let user = MedBook.ensureUser(Meteor.userId());

    // group sample labels by data set id
    let samplesByDataSetId = {};
    _.each(args.samples, (sample) => {
      if (!samplesByDataSetId[sample.data_set_id]) {
        samplesByDataSetId[sample.data_set_id] = [];
      }

      samplesByDataSetId[sample.data_set_id].push(sample.sample_label)
    });

    let jobId = Jobs.insert({
      name: "TumorMapOverlay",
      status: "creating",
      user_id: user._id,
      collaborations: [ user.personalCollaboration() ],
      args,
    });

    // if it's on the server go get the bookmark
    if (Meteor.isServer) {
      this.unblock();

      // build up the sample (aka "nodes") data
      console.log("loading data for tumor map");
      let nodes = {};

      _.each(samplesByDataSetId, (sampleLabels, data_set_id) => {
        // data set security
        let dataSet = DataSets.findOne(data_set_id);
        user.ensureAccess(dataSet);

        // initialize nodes[sampleLabels] to put gene data there
        _.each(sampleLabels, (label) => { nodes[label] = {}; });

        // load the data for this data set
        GeneExpression.find({ data_set_id }).forEach((doc) => {
          _.each(sampleLabels, (sample_label) => {
            let sampleIndex = dataSet.gene_expression_index[sample_label];
            let expValue = doc.rsem_quan_log2[sampleIndex];

            nodes[sample_label][doc.gene_label] = expValue;
          });
        });
      });
      console.log("done loading data");

      // do this to allow non-SSL connections (I think)
      process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

      // do the API call
      apiResponse = HTTP.call("POST",
          "https://tumormap.ucsc.edu:8112/query/overlayNodes", {
        data: {
          map: "CKCC/v1",
          layout: "mRNA",
          nodes
        }
      });

      if (apiResponse.statusCode === 200) {
        Jobs.update(jobId, {
          $set: {
            status: "done",
            output: {
              // TODO: should be `bookmark`
              bookmark_url: apiResponse.data.bookmarks[0],
            }
          }
        });
      } else {
        Jobs.update(jobId, { $set: { status: "error" } });
      }
    }
  },

  // return a list of the collaborations this user can share with
  getSharableCollaborations: function () {
    let user = MedBook.ensureUser(this.userId);

    // TODO: who can we share with?
    // XXX: can only share with users whose last-used app is using
    // the new medbook:collaborations code
    let usersCursor = Meteor.users.find({
      "collaborations.personal": { $exists: true }
    }, {
      fields: { "collaborations.personal": 1 }
    });

    let usersPersonalCollabs =
        _.pluck(_.pluck(usersCursor.fetch(), "collaborations"), "personal");

    return _.union(usersPersonalCollabs, user.getCollaborations());
  },
  // insertRecord: function(values) {
  //   check(values, Object);
  //
  //   let nonValueFields = [
  //     "collaborations",
  //     "data_set_id",
  //     "form_id",
  //     "patient_label",
  //     "sample_label",
  //   ];
  //
  //   // remove added fields so that values is just the values
  //   let record = _.pick(values, nonValueFields);
  //   record.values = _.omit(values, nonValueFields);
  //
  //   let user = MedBook.ensureUser(Meteor.userId());
  //   user.ensureAccess(Forms.findOne(record.form_id));
  //   user.ensureAccess(DataSets.findOne(record.data_set_id));
  //   user.ensureAccess(record.collaborations);
  //
  //   Records.insert(record);
  // },
  // insertForm: function(newForm) {
  //   check(newForm, Forms.simpleSchema());
  //
  //   let user = MedBook.ensureUser(Meteor.userId());
  //   user.ensureAccess(newForm);
  //   Forms.insert(newForm);
  // },
  insertCollaboration(newCollaboration) {
    check(newCollaboration, Collaborations.simpleSchema());

    var user = MedBook.ensureUser(Meteor.userId());
    // they must be an admin of the collaboration they create
    user.ensureAdmin(newCollaboration);

    if (Meteor.call("collabNameTaken", newCollaboration.name)) {
      throw new Meteor.Error("collaboration-name-taken");
    }

    return Collaborations.insert(newCollaboration);
  },
  collabNameTaken: function (collabName) {
    check(collabName, String);

    return !!Collaborations.findOne({name: collabName});
  },
  removeCollaboration(collaborationId) {
    check(collaborationId, String);

    let user = MedBook.ensureUser(this.userId);
    let collab = Collaborations.findOne(collaborationId);
    user.ensureAdmin(collab);

    // remove all collaborators and administrators so that no one can edit it
    // but no one can create one with that name
    Collaborations.update(collaborationId, {
      $set: {
        collaborators: [],
        administrators: [],
      }
    });
  },
  updateCollaboration(collaborationId, updateFields) {
    check(collaborationId, String);
    check(updateFields, new SimpleSchema({
      description: { type: String, optional: true },
      publiclyListed: { type: Boolean, optional: true },
      adminApprovalRequired: { type: Boolean, optional: true },
      administrators: { type: [String], optional: true },
      collaborators: { type: [String], optional: true },
    }));

    let user = MedBook.ensureUser(this.userId);
    let collab = Collaborations.findOne(collaborationId);
    user.ensureAdmin(collab);

    // make sure they're not doing anything illegal
    if (updateFields.administrators &&
        updateFields.administrators.length === 0) {
      throw new Meteor.Error("no-administrators");
    }

    Collaborations.update(collaborationId, {
      $set: updateFields
    });
  },
  joinCollaboration(collaborationId) {
    check(collaborationId, String);

    let user = MedBook.ensureUser(this.userId);
    let collab = Collaborations.findOne(collaborationId);

    // either add them to the collaboration or to the requests list
    if (collab.adminApprovalRequired) {
      Collaborations.update(collaborationId, {
        $addToSet: {
          requestsToJoin: {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            email: user.collaborations.email_address,
            personalCollaboration: user.personalCollaboration(),
          },
        }
      });

      // send an email to the admins so they know they need to approve people
      if (Meteor.isServer) {
        this.unblock();

        function getEmails(collabNames) {
          // NOTE: will be slow if there are many names
          return _.uniq(_.flatten(_.map(collabNames, (name) => {
            let user = MedBook.findUser({
              "collaborations.personal": name
            });

            // if it's a user grab the email otherwise email all
            // associated collaborators
            if (user) {
              return user.email();
            } else {
              let collab = Collaborations.findOne({ name });

              // sometimes the collab doesn't exist because the user
              // deleted their accont, logged into Telescope, or changed
              // their personal collaboration (can't yet, but maybe soon!)
              if (collab) {
                return getEmails(collab.getAssociatedCollaborators());
              }
            }
          })));
        }

        let to = getEmails(collab.administrators);

        let requestorName = user.profile.firstName + " " + user.profile.lastName;
        let subject = requestorName + " has requested access to the " +
            collab.name + " collaboration in MedBook";

        let url = "https://medbook.io/collaborations" +
            "?collaboration_id=" + collab._id;
        let html = "You can view pending requests for access " +
            "<a href=" + url + ">here</a>. <br><br>Email " + requestorName +
            " at <a href=mailto:" + user.email() + ">" + user.email() + "</a>.";

        Email.send({
          from: "ucscmedbook@gmail.com",
          to, subject, html,
        });
      }
    } else {
      Collaborations.update(collaborationId, {
        $addToSet: {
          collaborators: user.personalCollaboration(),
        }
      });

      // if they've joined the collaboration successfully return the _id
      return collaborationId
    }
  },
  leaveCollaboration(collaborationId) {
    check(collaborationId, String);

    let user = MedBook.ensureUser(this.userId);
    let collab = Collaborations.findOne(collaborationId);
    user.ensureAccess(collab.name);

    Collaborations.update(collaborationId, {
      $pull: {
        collaborators: user.personalCollaboration(),
      }
    });
  },
  setProfileName(firstAndLastName) {
    check(firstAndLastName, new SimpleSchema({
      firstName: { type: String },
      lastName: { type: String },
    }));

    let user = MedBook.ensureUser(this.userId);

    Meteor.users.update(user._id, {
      $set: {
        "profile.firstName": firstAndLastName.firstName,
        "profile.lastName": firstAndLastName.lastName,
      }
    });
  },
  approveOrDenyCollaborator(collaborationId, personalCollaboration,
      approvedIfTrue) {
    check([collaborationId, personalCollaboration], [String]);
    check(approvedIfTrue, Boolean);

    let user = MedBook.ensureUser(this.userId);
    let collab = Collaborations.findOne(collaborationId);
    user.ensureAdmin(collab);

    // always remove the request
    let pullObject = {
      requestsToJoin: {
        personalCollaboration,
      }
    };

    let modifier;
    if (approvedIfTrue) {
      modifier = {
        $addToSet: {
          collaborators: personalCollaboration
        },
        $pull: pullObject,
      }
    } else {
      modifier = { $pull: pullObject };
    }

    Collaborations.update(collaborationId, modifier);

    // send the email telling them if they were accepted or rejected
    if (Meteor.isServer) {
      this.unblock();

      let addingUser = MedBook.findUser({
        "collaborations.personal": personalCollaboration
      });
      let to = addingUser.email();
      let subject;
      let html;

      if (approvedIfTrue) {
        subject = "Access to " + collab.name + " approved";

        html = "Your request for access to the " + collab.name +
            " collaboration in MedBook has been approved! " +
            "<br><br>Access MedBook at " +
            "<a href=https://medbook.io>medbook.io</a>.";
      } else {
        subject = "Access to " + collab.name + " rejected";

        let rejectEmail = user.email();
        html = "Your request for access to the " + collab.name +
            " collaboration in MedBook has been rejected. <br><br>" +
            "Please contact " +
            "<a href=mailto:" + rejectEmail + ">" + rejectEmail +
            "</a> for more information.";
      }

      Email.send({
        from: "ucscmedbook@gmail.com",
        to, subject, html,
      });
    }
  },

  // shareAndDeleteButtons
  removeObject(collection_name, mongo_id) {
    check([collection_name, mongo_id], [String]);

    let user = MedBook.ensureUser(Meteor.userId());
    let object = MedBook.collections[collection_name].findOne(mongo_id);
    user.ensureAccess(object);

    let removeAllowedCollections = [
      "Jobs",
      "DataSets",
      "SampleGroups",
      "Forms",
      "GeneSets",
      "GeneSetGroups",
      "Studies",
    ];
    if (removeAllowedCollections.indexOf(collection_name) === -1) {
      throw new Meteor.Error("permission-denied");
    }

    // do some collection-specific checking before actually removing the object
    if (collection_name === "Jobs") {
      let deleteableJobs = [
        "RunGSEA",
        "RunLimmaGSEA",
        "TumorMapOverlay",
        "UpDownGenes",
        "RunPairedAnalysis",
        "RunLimma",
        "RunSingleSampleTopGenes",
      ];

      if (deleteableJobs.indexOf(object.name) === -1) {
        throw new Meteor.Error("permission-denied");
      }
    }

    // remove associated blobs
    // NOTE: Blobs2.delete isn't defined on the client
    if (Meteor.isServer) {
      Blobs2.delete({
        "associated_object.collection_name": collection_name,
        "associated_object.mongo_id": mongo_id,
      }, (err, out) => {
        if (err) {
          console.log("Error deleting blobs for:",
              collection_name, mongo_id, err);
        }
      });
    }

    // remove other linked object types
    let associatedQuery = {
      "associated_object.collection_name": collection_name,
      "associated_object.mongo_id": mongo_id,
    };

    if (collection_name === "DataSets") {
      GenomicExpression.remove({ data_set_id: mongo_id });
    } else if (collection_name === "Forms"
        || collection_name === "GeneSets") {
      Records.remove(associatedQuery);
    } else if (collection_name === "GeneSetGroups") {
      GeneSets.remove({ gene_set_group_id: mongo_id });
    }

    // recursively remove associated gene sets
    // ==> we need to remove not just the gene sets but the gene sets
    //     associated objects
    // Only do this on the server because the data isn't necessarily loaded.
    if (Meteor.isServer) {
      GeneSets.find(associatedQuery).forEach((geneSet) => {
        Meteor.call("removeObject", "GeneSets", geneSet._id);
      });
    }

    // remove original object
    // NOTE: do this after so the associated objects can still look
    // it up for security until the very end
    MedBook.collections[collection_name].remove(mongo_id);
  },
  updateObjectCollaborations(collectionName, mongoId, collaborations) {
    check([collectionName, mongoId], [String]);
    check(collaborations, [String]);

    let user = MedBook.ensureUser(Meteor.userId());
    let collection = MedBook.collections[collectionName];
    let object = collection.findOne(mongoId);
    user.ensureAccess(object);

    collection.update(mongoId, {
      $set: { collaborations }
    });
  },

  // manage data sets
  insertDataSet(newDataSet) {
    check(newDataSet, DataSets.simpleSchema().pick([
      "name",
      "description",
      "value_type",
      "metadata",
    ]));

    var user = MedBook.ensureUser(Meteor.userId());

    newDataSet.collaborations = [ user.personalCollaboration() ];
    return DataSets.insert(newDataSet);
  },
  newSampleLabel(sampleDefinition) {
    check(sampleDefinition, new SimpleSchema({
      study_label: { type: String },
      uq_sample_label: { type: String },
    }));

    let { uq_sample_label, study_label } = sampleDefinition;

    let user = MedBook.ensureUser(Meteor.userId());
    user.ensureAccess(Studies.findOne({ study_label }));

    let sample_label = study_label + "/" + uq_sample_label;
    if (!sample_label.match(MedBook.sampleLabelRegex)) {
      throw new Meteor.Error("invalid-sample-label");
    }

    Studies.update({ study_label }, {
      $addToSet: {
        sample_labels: sample_label
      }
    });
  },

  studyLabelTaken(study_label) {
    check(study_label, String);

    let user = MedBook.ensureUser(Meteor.userId());

    return !!Studies.findOne({ study_label });
  },
  insertStudy(newStudy) {
    check(newStudy, Studies.simpleSchema().pick([
      "name",
      "description",
      "study_label",
    ]));

    let user = MedBook.ensureUser(Meteor.userId());

    newStudy.collaborations = [ user.personalCollaboration() ];

    // must be unique
    if (Meteor.call("studyLabelTaken", newStudy.study_label)) {
      console.log("throw it out");
      throw new Meteor.Error("study-label-not-unique");
    }

    return Studies.insert(newStudy);
  },

  insertGeneSet(formValues, computedColumns) {
    check(formValues, GeneSets.simpleSchema().pick([
      "name",
      "description",
      "gene_label_field"
    ]));

    check(computedColumns, [ new SimpleSchema({
      header: { type: String },
      // allowedValues validation will happen on insert
      value_type: { type: String },
      values: { type: [String] },
    }) ]);

    let user = MedBook.ensureUser(Meteor.userId());

    // initialize enough records to be inserted later
    let records = [];
    _.times(computedColumns[0].values.length, () => {
      records.push({
        associated_object: {
          collection_name: "GeneSets"
        }
      });
    });

    let fields = _.map(computedColumns, (column, colIndex) => {
      let field = {
        name: column.header,
        value_type: column.value_type,
      };

      // calculate the record values for this field
      let recordValues = _.map(column.values, (cellValue, recordIndex) => {
        if (field.value_type === "Number") {
          // if the cell was blank, make the field optional and return null
          // NOTE: if they entered 0, cellValue would be "0", which is truthy
          if (!cellValue) {
            field.optional = true;
            return null;
          }

          // if the number was entered as an integer, save it as an integer
          if (cellValue.indexOf(".") === -1) {
            return parseInt(cellValue);
          } else {
            return parseFloat(cellValue);
          }
        } else {
          // if falsey, pretend it's blank for the SimpleSchema custom
          // function which uses typeof
          if (!cellValue) { return ""; }

          return cellValue;
        }
      });

      // add the record values to the record
      _.each(recordValues, (value, index) => {
        records[index][field.name] = value;
      });

      return field;
    });



    // make sure the gene_label_field points to a valid field:
    // - all values defined, not blank, and no spaces
    // - values are unique
    // - value_type is string

    let geneLabelField = _.findWhere(fields, {
      name: formValues.gene_label_field
    });

    // make sure it's type String
    if (geneLabelField.value_type !== "String") {
      throw new Meteor.Error("gene-label-field-invalid");
    }

    // make sure they're unique
    let geneLabelValues = _.pluck(records, geneLabelField.name);
    let gene_labels = _.uniq(geneLabelValues);
    if (gene_labels.length !== geneLabelValues.length) {
      throw new Meteor.Error("gene-label-field-invalid");
    }

    // make sure there's no blank values or spaces
    _.each(gene_labels, (label) => {
      if (/\s/.test(label) || !label) {
        throw new Meteor.Error("gene-label-field-invalid");
      }
    });



    // validate all records before inserting the gene set
    _.each(records, (record) => {
      // set to a dummy value so that the record is valid: we'll set
      // this to the actual gene set _id after inserting
      record.associated_object.mongo_id = "not a real _id";

      MedBook.validateRecord(record, fields);
    });

    // create the gene set
    let geneSet = _.extend(formValues, {
      collaborations: [ user.personalCollaboration() ],
      fields,
      gene_labels,
    });

    let geneSetId = GeneSets.insert(geneSet);

    // set the mongo_id for each record and insert
    _.each(records, (record) => {
      record.associated_object.mongo_id = geneSetId;

      Records.insert(record);
    });

    return geneSetId;
  },

  // Rename a sample: if a user has access to a study they can rename
  // a sample (including in objects they don't have access to).
  // See feature issue: https://github.com/UCSC-MedBook/patient-care/issues/57
  renameSampleLabel(studyId, oldSampleLabel, newUQSampleLabel) {
    check([studyId, oldSampleLabel, newUQSampleLabel], [String]);

    let user = MedBook.ensureUser(Meteor.userId());
    let study = Studies.findOne(studyId);
    user.ensureAccess(study);

    // make sure the sample exists in the study
    if (study.sample_labels.indexOf(oldSampleLabel) === -1) {
      throw new Meteor.Error("invalid-sample-label");
    }

    // construct new qualified sample label
    var newSampleLabel = study.study_label + "/" + newUQSampleLabel;

    // make sure the new sample label doesn't already exist
    if (study.sample_labels.indexOf(newSampleLabel) !== -1) {
      throw new Meteor.Error("sample-already-exists");
    }

    // Update the sample label in
    // - Studies
    // - DataSets
    // - Forms (and Records)
    // - SampleGroups

    Studies.update({
      _id: studyId,
      // need this to do the fancy $ trick in the $set
      sample_labels: oldSampleLabel
    }, {
      $set: {
        "sample_labels.$": newSampleLabel
      }
    });

    DataSets.find({ sample_labels: oldSampleLabel }).forEach((dataSet) => {
      let oldIndex = dataSet.sample_label_index[oldSampleLabel];

      DataSets.update(dataSet._id, {
        $set: {
          [`sample_labels.${oldIndex}`]: newSampleLabel,
          [`sample_label_index.${newSampleLabel}`]: oldIndex
        },
        $unset: {
          [`sample_label_index.${oldSampleLabel}`]: 1
        },
      });
    });

    Forms.find({ sample_labels: oldSampleLabel }).forEach((form) => {
      // update associated records
      Records.update({
        "associated_object.collection_name": "Forms",
        "associated_object.mongo_id": form._id,
      }, {
        $set: {
          [form.sample_label_field]: newSampleLabel
        }
      });

      // update the sample label in the form
      Forms.update({
        _id: form._id,
        sample_labels: oldSampleLabel
      }, {
        $set: {
          "sample_labels.$": newSampleLabel
        }
      });
    });

    // We have to do a forEach here because it's not possible to update
    // sample groups two array levels deep
    var sampleGroupCursor = SampleGroups.find({
      "data_sets.sample_labels": oldSampleLabel
    });
    sampleGroupCursor.forEach((sampleGroup) => {
      // for each data set in the sample group, update the sample names
      // in the sample list
      _.each(sampleGroup.data_sets, (sgDataSet, sgDataSetIndex) => {
        let sampleIndex = sgDataSet.sample_labels.indexOf(oldSampleLabel);

        if (sampleIndex !== -1) {
          let attributeName =
              `data_sets.${sgDataSetIndex}.sample_labels.${sampleIndex}`;

          // NOTE: intentionally not updating the filters so that we
          // don't "rewrite history".
          SampleGroups.update(sampleGroup._id, {
            $set: {
              [attributeName]: newSampleLabel
            }
          });
        }
      });
    });
  },

  // Allow anyone to refresh the access table for cBioPortal. There is
  // no UI for this job and if an attacker calls it, it will just refresh
  // the list again which isn't the end of the world.
  refreshCBioPortalAccess() {
    // at least make sure they're logged in so we know who they are...
    let user = MedBook.ensureUser(Meteor.userId());

    Jobs.insert({
      name: "UpdateCbioSecurity",
      user_id: user._id,
      args: {
        collab_names: [ "WCDT" ]
      }
    });
  },
});

if (Meteor.isServer) {
  // for deleting records
  Moko.ensureIndex(Records, {
    "associated_object.collection_name": 1,
    "associated_object.mongo_id": 1,
  });
}
