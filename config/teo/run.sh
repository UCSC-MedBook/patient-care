export MONGO_URL="mongodb://localhost:27017/MedBook"

if [ -z "$1" ]; then
    meteor --port 3001 --settings ~/work/medbook/workbench/config/teo/settings.json
else
    meteor $1 --port 3001 --settings ~/work/medbook/workbench/config/teo/settings.json
fi
