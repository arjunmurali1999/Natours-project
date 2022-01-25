const express = require("express");
// eslint-disable-next-line import/no-absolute-path
const tourController = require("../controllers/tourcontroller");
const authController = require("../controllers/authcontroller");
const reviewRouter = require("./reviewRoute");
// Route handler
const router = express.Router();
// router.param('id', tourController.checkID);

router.use("/:tourId/reviews", reviewRouter); //note-router itself is a middleware

router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getalltours);

router.route("/tour-stats").get(tourController.getTourStats);
router.route("/monthly-plan/:year").get( authController.protect,
  authController.restrictTo("admin", "lead-guide","guide"),tourController.getMonthlyPlan);
router
  .route("/")
  .get(tourController.getalltours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createtour
  )
  .delete(tourController.deleteallTour);

router
  .route("/:id")
  .get(tourController.gettour)
  .patch(
    authController.protect,
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    authController.restrictTo("admin", "lead-guide"),
    tourController.updatetour
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour
  );

//POST /tour/23456/reviews
//GET /tour/234fas/reviews
//GET /tour/23456/reviews/3456
// router
//   .route("/:tourId/reviews")
//   .post(
//     authController.protect,
//     authController.restrictTo("user"),
//     reviewController.createReview
//   );
router.route('/tours-within/:distance/center/:lating/unit/:unit').get(tourController.getToursWithin)
//tours-within?distance=233&center=-40,45&unit=mi
//tours-within/233/center/-40,45/unit/mi

router.route('/distances/:lating/unit/:unit').get(tourController.getDistances)

module.exports = router;
