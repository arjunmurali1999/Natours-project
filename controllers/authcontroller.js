const crypto = require("crypto");
const { promisify } = require("util"); //built in utility in node
const jwt = require("jsonwebtoken");
const User = require("../models/usermodel");
const catchAsync = require("../utils/catchasync");
const AppError = require("../utils/appError");
const Email = require("../utils/email");

const signToken = (
  id //this function creates the token for the user
) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, //to prevent cross side scripting attacks
  };
  res.cookie("jwt", token, cookieOptions);
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  //post the user after sign up
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirmation: req.body.passwordConfirmation,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url=`${req.protocol}://${req.get('host')}/me`;
  // console.log(url)
  await new Email(newUser,url).sendWelcome()
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  //Checks the login and validates the user
  const { email, password } = req.body;
  //  1)Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400)); //Http code 400 for bad request
  }
  // 2)Check if user exists and password is correct

  const user = await User.findOne({ email }).select("+password"); //selects email and password

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("incorrect email or password", 401)); //401 status code-unauthorised
  }
  // 3)if everything is ok send json web token to client
  createSendToken(user, 200, res);
});
exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

exports.protect = catchAsync(async (req, res, next) => {
  //1)Getting token and check of its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    // console.log(token)
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError("You are not logged in please log in to get access", 401)
    );
  }
  //2)Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //promisify((verification of token)(token,secret message))
  //3)Check if user still exists(if the user  canges the password)
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exists", 401)
    );
  }
  //4)Check if user changed password after the token was issued
  if (currentUser.changePassword(decoded.iat) === true) {
    //decoded.iaat gives when the token has been decoded
    return next(
      new AppError("your password changed recently !Please login again", 401)
    );
  }
  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//only for rendered pages ,there will be no errors
exports.isLoggedin = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      //1) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      ); //promisify((verification of token)(token,secret message))
      //3)Check if user still exists(if the user  canges the password)
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //4)Check if user changed password after the token was issued
      if (currentUser.changePassword(decoded.iat) === true) {
        //decoded.iaat gives when the token has been decoded
        return next(new AppError());
      }
      //There is already a logged in user
      res.locals.user = currentUser; //res.local.user passes the value to pug template where we get access to the logged in user
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // if the passed role in restrictTo() function does not include the req.user.role
    //then it will not give permission to delete the object in database
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
    next();
    //roles is an array example ['admin','lead-guide'].role='user'
  };

exports.forgotpassword = catchAsync(async (req, res, next) => {
  //1)GET user based on posted email address
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email address.", 404));
  }
  //2)Generate the random reset token
  const resetToken = user.createpasswordresettoken();
  await user.save({ validateBeforeSave: false }); //validationbefore save is set to false because validation leads to asking for password,other required fields in usermodel
  //3)send it to users email
  try {
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetpassword/${resetToken}`;
    await new Email(user,resetURL).passwordReset();
    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        "There was an error sending the email .Please Try again later!",
        500
      )
    );
  }
});

exports.resetpassword = catchAsync(async (req, res, next) => {
  //1)get user based on the Token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2) if token has not expired and there is user set the new password
  if (!user) {
    return next(new AppError("Token is invalid or Expired", 401));
  }
  user.password = req.body.password;
  user.passwordConfirmation = req.body.passwordConfirmation;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3)Update changedPassword Property for the user

  //4)log the user in send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  //2)Check the posted password is correctPassword
  if (
    !user ||
    !(await user.correctPassword(req.body.passwordCurrent, user.password))
  ) {
    return next(
      new AppError("incorrect password Please Type the correct password", 401)
    ); //401 status code-unauthorised
  }
  //3)if so update password
  user.password = req.body.password;
  user.passwordConfirmation = req.body.passwordConfirmation;
  await user.save();
  //User.findByIdAndUpdate will not work as intended because that querywill not validatethe password and also encryptionmiddleware does not runon it

  //4)Log user in send JWT})
  createSendToken(user, 200, res);
});
