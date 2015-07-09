echo "running update script on server to generate new data"
ssh dtflemin@su2c-dev.ucsc.edu /data/MedBook/scripts/teo_rebuild_patient_reports_and_export.sh

echo "removing old json file"
rm teo_patient_reports.json

echo "downloading file from server..."
scp dtflemin@su2c-dev.ucsc.edu:/data/MedBook/scripts/teo_patient_reports.json .

echo "removing all records from local database"
mongo localhost:27017/MedBook remove_all_patient_records.js

echo "importing the new stuff into the local database"
mongoimport -d MedBook -c patient_reports teo_patient_reports.json
