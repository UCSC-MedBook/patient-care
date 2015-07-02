# Created by Teo Fleming (github mokolodi1, mokolodi1@gmail.com)

# the first line of the file serves as lables for the rest of the data

if [ -z $3 ]; then
    echo "Usage: ./tsv_to_mongodb [tsv_file] [database] [collection]"
    exit
fi

if [ -e $1 ]; then
    cat $1 | tr "\t" "," | mongoimport -d $2 -c $3 --type csv --headerline
else
    echo "$1 does not exist or is not readable"
    exit
fi
