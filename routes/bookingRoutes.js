const express = require("express");
const bookingController = require("../controllers/bookingController");
const authController = require("../controllers/authcontroller");

const router = express.Router();

router.get(
  "/checkout-session/:tourId",
  authController.protect,
  bookingController.getCheckoutsession
);
// router.get(
//   "/allbookings",
//   authController.protect,
//   authController.restrictTo("admin"),
//   bookingController.getBookingDetails
// );
router.use(authController.protect,authController.restrictTo("admin", "lead-guide"));
router
  .route("/")
  .get(bookingController.getBookingDetails)
  .post(bookingController.createBookingCheckout);

router
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(bookingController.updateBookingDetails)
  .delete(bookingController.deleteBookingDetails);
module.exports = router;
