db.patients.remove({})

db.getCollection('data_sets').find({}).forEach(function(doc) {
    var patientsAdded = 0;

    if (!doc["patients"]) return;

    for (var i = 0; i < doc["patients"].length; i++) {
        var patient = doc["patients"][i];
        var samples = [];
        for (var s = 0; s < patient["sample_labels"].length; s++) {
            samples.push({
                sample_label: patient["sample_labels"][s],
                data_set_id: doc._id,
            });
        }

        db.getCollection("patients").insert({
            _id: new ObjectId().valueOf(),
            patient_label: patient.patient_label,
            samples: samples,
            collaborations: doc.collaborations
        });

        patientsAdded++;
    }

    print(patientsAdded);
})

// db.getCollection("data_sets").update({}, {$unset: {patients: 1, sample_labels: 1}}, {multi: true})
