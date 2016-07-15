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

    console.log("getting forms for", data_set_id); // XXX 

    check(data_set_id, String);

    // Client-side stub:
    if( Meteor.isClient) {
      let stub = [{
          urlencodedId: "placeholder_loadingforms",
          name: "Loading forms...",
          fields: [],
        }];
      console.log("returning client side stub", stub);
      return stub;
    }

    // Permissions
    let dataset = DataSets.findOne(data_set_id);
    let user = MedBook.ensureUser(Meteor.userId());
    user.ensureAccess(dataset);

    let samples = dataset.sample_labels;

    let formsWithFields = [] ;

    // For each user-accessible form
    Forms.find().forEach(function(form){
      if (! user.hasAccess(form)) { return; }

      // Populate the form field table with its fields
      let encoded_form_id = encodeURI(form._id);
      let sample_label_field = form.sample_label_field ;
 
      // Set up the fields to be populated with potential values
      // Remove the sample_label_field from the fields because
      // we don't want to be able to query on every individual sample
      let currentFormFields = _.without(form.fields, 
        { "name": sample_label_field, "value_type" : "String"}
        );
     
      // And add an array of available values. 
      currentFormFields = _.map(currentFormFields, function(field){
        field["values"] = [];
        return field;
      });
      
      // Find all records in that form for our samples
      // and add its values to the values fields.
      // However, don't populate the unique ID fields. 
      let fieldsToSkip = ["_id", sample_label_field];
      Records.find({
        $and : [
          {sample_label_field : { $in: samples}},
          {"form_id" : form._id},
        ]
      }).forEach(function(record){
        for(field in record){
          if (fieldsToSkip.indexOf(field) === -1){ 
            currentFormFields[field] = _.union([record[field]], currentFormFields[field] );
            console.log("populating", field);
            console.log("Added ", record[field], "and it's now", currentFormFields[field]);
          }
        }
      });
             
      formsWithFields.push({
        urlencodedId: encoded_form_id,
        name: form.name,
        fields: currentFormFields
        });
    }); 

    console.log("finished making fields, returning:", formsWithFields);

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

    let dataset = DataSets.findOne(data_set_id);
    let form = Forms.findOne({_id: form_id});
    let samples = dataset.sample_labels;
    let sample_label_field = form.sample_label_field ;

    // Confirm permissions
    let user = MedBook.ensureUser(Meteor.userId());
    user.ensureAccess(dataset);
    user.ensureAccess(form);

    console.log("Query to be run:", serialized_query); // XXX 
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
    let querySpecificForm = {
      "$and": [ 
        {sample_label_field: {$in: samples}},
        {"form_id" : form._id},
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
  createLimmaGSEA: function (args) {
    check(args, new SimpleSchema({
      sample_group_a_id: { type: String },
      sample_group_b_id: { type: String },
      limma_top_genes_count: { type: Number, min: 1 },
      gene_set_collection_id: { type: String },
    }));

    let user = MedBook.ensureUser(Meteor.userId());

    let geneSetColl = GeneSetCollections.findOne(args.gene_set_collection_id);
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
      gene_set_collection_name: geneSetColl.name,
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
  insertRecord: function(values) {
    check(values, Object);

    let nonValueFields = [
      "collaborations",
      "data_set_id",
      "form_id",
      "patient_label",
      "sample_label",
    ];

    // remove added fields so that values is just the values
    let record = _.pick(values, nonValueFields);
    record.values = _.omit(values, nonValueFields);

    let user = MedBook.ensureUser(Meteor.userId());
    user.ensureAccess(Forms.findOne(record.form_id));
    user.ensureAccess(DataSets.findOne(record.data_set_id));
    user.ensureAccess(record.collaborations);

    Records.insert(record);
  },
  insertForm: function(newForm) {
    check(newForm, Forms.simpleSchema());

    let user = MedBook.ensureUser(Meteor.userId());
    user.ensureAccess(newForm);
    Forms.insert(newForm);
  },
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
      this.unblock();

      function getEmails(collabNames) {
        // NOTE: will be very slow if there are many names
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

            return getEmails(collab.getAssociatedCollaborators());
          }
        })));
      }

      let to = getEmails(collab.administrators);
      let cc = user.collaborations.email_address;

      let requestorName = user.profile.firstName + " " + user.profile.lastName;
      let subject = requestorName + " is requesting access to the " +
          collab.name + " collaboration in MedBook";

      let url = "https://medbook.io/collaborations" +
          "?collaboration_id=" + collab._id;
      let html = "You can view pending requests for access " +
          "<a href=" + url + ">here</a>. <br><br>Email " + requestorName +
          " at <a href=mailto:" + user.email() + ">" + user.email() + "</a>.";

      Email.send({
        from: "ucscmedbook@gmail.com",
        to, cc, subject, html,
      });
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
  },

  // shareAndDeleteButtons
  removeObject(collectionName, mongoId) {
    check([collectionName, mongoId], [String]);

    let user = MedBook.findUser(Meteor.userId());
    let object = MedBook.collections[collectionName].findOne(mongoId);
    user.ensureAccess(object);

    let removeAllowedCollections = [
      "Jobs",
      "DataSets",
      "SampleGroups",
      "Forms",
      "GeneSetCollections",
      "Studies",
    ];
    if (removeAllowedCollections.indexOf(collectionName) === -1) {
      throw new Meteor.Error("permission-denied");
    }

    // do some collection-specific checking before actually removing the object
    if (collectionName === "Jobs") {
      let deleteableJobs = [
        "RunLimmaGSEA",
        "TumorMapOverlay",
        "UpDownGenes",
      ];

      if (deleteableJobs.indexOf(object.name) === -1) {
        throw new Meteor.Error("permission-denied");
      }
    }

    MedBook.collections[collectionName].remove(mongoId);
  },
  updateObjectCollaborations(collectionName, mongoId, collaborations) {
    check([collectionName, mongoId], [String]);
    check(collaborations, [String]);

    let user = MedBook.findUser(Meteor.userId());
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

    let user = MedBook.findUser(Meteor.userId());
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

    let user = MedBook.findUser(Meteor.userId());

    return !!Studies.findOne({ study_label });
  },
  insertStudy(newStudy) {
    check(newStudy, Studies.simpleSchema().pick([
      "name",
      "description",
      "study_label",
    ]));

    let user = MedBook.findUser(Meteor.userId());

    newStudy.collaborations = [ user.personalCollaboration() ];

    // must be unique
    if (Meteor.call("studyLabelTaken", newStudy.study_label)) {
      console.log("throw it out");
      throw new Meteor.Error("study-label-not-unique");
    }

    return Studies.insert(newStudy);
  },
});
