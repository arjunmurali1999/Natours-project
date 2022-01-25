const express = require("express");

const router = express.Router({ mergeParams: true }); //merges the params of tour router to review Router
const reviewController = require("../controllers/reviewcontroller");
const authController = require("../controllers/authcontroller");

//POST /tour/1234456/reviews
//POST /reviews
router.use(authController.protect);
router
  .route("/")
  .get(authController.restrictTo("user"), reviewController.getallreviews);
router
  .route("/")
  .post(
    authController.restrictTo("user"),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(authController.restrictTo('user','admin'),reviewController.updateReview)
  .delete(authController.restrictTo('user','admin'),reviewController.deleteReview);

module.exports = router;
