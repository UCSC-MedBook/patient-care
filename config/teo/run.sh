export MONGO_URL="mongodb://localhost:27017/MedBook"
export MEDBOOK_FILESTORE=/tmp/filestore

meteor --port 3001 --settings ../config/teo/settings.json
