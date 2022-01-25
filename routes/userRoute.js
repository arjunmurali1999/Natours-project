const express = require("express");
const userController = require("../controllers/usercontroller");
const authcontroller = require("../controllers/authcontroller");

const userRouter = express.Router();
userRouter.get(
  "/me",
  authcontroller.protect,
  userController.getme,
  userController.getuser
);
userRouter.post("/signup", authcontroller.signup);
userRouter.post("/login", authcontroller.login);
userRouter.get("/logout", authcontroller.logout);

userRouter.post("/forgotpassword", authcontroller.forgotpassword);
userRouter.patch("/resetpassword/:token", authcontroller.resetpassword);

//.protect is a middlleware function , it always runs on sequence
//protect all routes after this middleware
userRouter.use(authcontroller.protect);
userRouter.patch("/updatepassword", authcontroller.updatePassword);
userRouter.patch("/updateme",userController.uploadUserPhoto,userController.resizeUserPhoto,userController.updateme);
userRouter.delete("/deleteme", userController.deleteMe);

userRouter.use(authcontroller.restrictTo("admin"));

userRouter
  .route("/")
  .get(userController.getallusers)
  .post(userController.createallusers);

userRouter
  .route("/:id")
  .get(userController.getuser)
  .patch(userController.updateuser)
  .delete(userController.deleteuser);

module.exports = userRouter;
