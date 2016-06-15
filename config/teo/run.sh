export MONGO_URL="mongodb://localhost:27017/MedBook"
source ../config/teo/sensitive_info.sh

if [ -z "$1" ]; then
    meteor --port 3001
else
    meteor $1 --port 3001
fi
