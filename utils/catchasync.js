const catchAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch((err) => next(err)); //next(err) is a global error handling middleware
};
module.exports = catchAsync;
