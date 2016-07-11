export MONGO_URL="mongodb://localhost:27017/MedBook"
export MEDBOOK_FILESTORE="/Users/mokolodi1/work/medbook/medbook/filestore"

if [ -d "$MEDBOOK_FILESTORE" ]; then
    # make a filestore folder in the MedBook parent repo
    mkdir $MEDBOOK_FILESTORE
fi

if [ -z "$1" ]; then
    meteor --port 3001
else
    meteor $1 --port 3001
fi
