const express = require("express");
const viewsController = require("../controllers/viewscontroller");
const authController = require("../controllers/authcontroller");
const bookingController = require("../controllers/bookingController");


const router = express.Router();

router.get("/",bookingController.createBookingCheckout,authController.isLoggedin, viewsController.getOverview);
router.get("/tour/:slug", authController.isLoggedin, viewsController.gettour);
router.get("/login", authController.isLoggedin, viewsController.login);
router.get("/signup",viewsController.signup);
router.get("/me", authController.protect, viewsController.getAccount);
router.get("/my-tours", authController.protect, viewsController.getMyTours);

router.post(
  "/submit-user-data",
  authController.protect,
  viewsController.updateUserData
);
module.exports = router;
