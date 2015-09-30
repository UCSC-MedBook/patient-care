# export NODE_OPTIONS='--debug'
export MONGO_URL=mongodb://localhost:27017/MedBook
export ROOT_URL=https://su2c-dev.ucsc.edu/PatientCare/
cd webapp
meteor --port 10013
