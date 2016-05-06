// // https://github.com/CollectionFS/Meteor-CollectionFS/issues/457#issuecomment-139601441
//
// var getBase64Data = function(file, callback) {
//   // callback has the form function (err, res) {}
//   var readStream = file.createReadStream();
//   var buffer = [];
//   readStream.on('data', function(chunk) {
//     buffer.push(chunk);
//   });
//   readStream.on('error', function(err) {
//     callback(err, null);
//   });
//   readStream.on('end', function() {
//     callback(null, buffer.concat()[0].toString('base64'));
//   });
// };
//
// getBase64DataSync = Meteor.wrapAsync(getBase64Data);
// 
// Picker.route("/:study_label/:patient_label/upDownGenes/:job_id/download/:up_or_down", function(params, req, res, next) {
//   // // set some headers
//   // res.setHeader('Content-disposition', 'attachment; filename=dramaticpenguin.MOV');
//   // res.setHeader('Content-type', 'video/quicktime'); // set mime-type
//
//   res.write("hi");
//   res.end();
//
//   // if (!site) {
//   //   res.end();
//   // } else {
//   //   var zip = new JSZip();
//   //   zip.file('gateway-config.json', site_);
//   //   var zip_ = zip.generate({type: 'nodebuffer', compression: 'DEFLATE'});
//   //
//   //   //res.setHeader('Content-Type', 'application/octet-stream');
//   //   res.setHeader('Content-disposition', 'attachment; filename=gateway-config.zip');
//   //
//   //   res.end(zip_);
//   // }
// });
