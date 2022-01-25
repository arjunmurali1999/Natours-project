const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // const value=err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)
  const key = Object.keys(err.keyValue).join("");
  const message = `The key '${key}' has duplicate value of '${err.keyValue[key]}'`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")} `;
  return new AppError(message, 400);
};
const handleJWTerror = () =>
  new AppError("Invalid Token please login again", 401);
const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith("/api")) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //RENDERED WEBSITE
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong",
    msg: err.message,
  });
};
const handleJWTError = () =>
  new AppError("Your Token has expired Please login Again", 401);
const sendErrorProd = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith("/api")) {
    // A)isoperational ,trusted error: send messaage to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      //B)Programming or other unknown error:dont leak error details
    }
    //1)log error
    // eslint-disable-next-line no-console
    console.error("Error", err);
    //2)Send generate error
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong",
      msg: "Please try again later"
    });
  }
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programming or other unknown error:dont leak error details
  }
  //1)log error
  // eslint-disable-next-line no-console
  console.error("Error", err);
  //2)Send generate error
  return res.status(500).json({
    status: "error",
    message: "Please try again later",
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    let error = { ...err };
    // eslint-disable-next-line no-console
    if (err.name === "CastError") {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (err.name === "ValidationError") {
      error = handleValidationErrorDB(error);
    }
    if (err.name === "JsonWebTokenError") {
      error = handleJWTerror(error);
    }
    if (err.name === "TokenExpiredError") {
      error = handleJWTError(error);
    }
    sendErrorProd(error, req, res);
  }
};
