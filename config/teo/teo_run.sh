if [ -d "webapp" ]; then
    cd webapp
fi

MONGO_URL="mongodb://localhost:27017/MedBook" meteor --port 3001
