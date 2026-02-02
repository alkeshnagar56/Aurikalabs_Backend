const mongoose = require("mongoose");

async function connectToDB(URL) {
  return await mongoose.connect(URL);
}

module.exports = connectToDB;
