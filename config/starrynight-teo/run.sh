export MONGO_URL="mongodb://localhost:27017/MedBook"

if [ -z "$1" ]; then
    meteor --port 3000
else
    meteor $1 --port 3000
fi
