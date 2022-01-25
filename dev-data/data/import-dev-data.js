/* eslint-disable no-console */
const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
// eslint-disable-next-line import/no-unresolved
const Tour = require("../../models/tourmodel");
const User = require("../../models/usermodel");
const Review = require("../../models/reviewmodel");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    // eslint-disable-next-line no-console
  });

//   Read JSON files
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, "utf-8"));
// import Data into the Database
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users,{validateBeforeSave:false})
    await Review.create(reviews);
    console.log("Data successfully loaded");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE ALLDATA FROM DATABASE
const deleteData = async () => {
  try {
    await Tour.deleteMany(); //Delete all the elements in the Tours Collection
    await User.deleteMany();
    await Review.deleteMany();
    console.log("Data successfully deleted");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
if (process.argv[2] === "--import") {
  //node {pathname} --import will import  all the data
  importData();
} else if (process.argv[2] === "--delete") {
  //node {pathname} --delete will delete all the data
  deleteData();
}

console.log(process.argv);
