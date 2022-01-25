/* eslint-disable no-console */
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });
//UNCAUGHT EXCEPTION HANDLING
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION");
  console.log(err.name, err.message);
  process.exit(1);
});
const DB = process.env.DATABASE;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("DB connection successfully established");
  })
  .catch((err) => console.log("ERROR", err));
// console.log(process.env)
const app = require("./app");

const port = 3000;
const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`app running on port ${port}`);
});

// UNHANDLED REJECTIONS
process.on("unhandledRejection", (err) => {
  //Process.on listens to the event unhandledRejection
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTIONS shutting down...");
  server.close(() => {
    process.exit(1); //process.exit() terminates the process
  });
});
