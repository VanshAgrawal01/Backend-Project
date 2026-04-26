const mongoose = require('mongoose');

function connectToDB() {

    mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log('Connected to MongoDB');
    }
    ).catch((err) => {
        console.error('Error connecting to MongoDB', err);
        process.exit(1);
    }
    );
  }


  module.exports = connectToDB;