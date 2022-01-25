const review = require("../models/reviewmodel");
const factory = require("./handlerfactory");

exports.getallreviews = factory.getall(review);

// exports.getallreviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };
//   const reviews = await review.find(filter);
//   if (!reviews) {
//     return next(new AppError("There is no review available", 404));
//   }
//   res.status(200).json({
//     status: "success",
//     reviews: reviews,
//   });
// });

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }

  if (!req.body.user) {
    req.body.user = req.user.id;
  }
  next();
};
exports.createReview = factory.createOne(review);
// exports.createReview = catchAsync(async (req, res, next) => {
//   //Allow nested routes

//   const newreview = await review.create(req.body);
//   res.status(201).json({
//     status: "success",
//     review: newreview,
//   });
// });
exports.getReview = factory.getOne(review);
exports.updateReview = factory.UpdateOne(review);
exports.deleteReview = factory.deleteone(review);
