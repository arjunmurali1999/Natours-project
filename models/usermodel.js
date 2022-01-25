const mongoose = require("mongoose");
const crypto = require("crypto");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email address"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: {
    type: String,
    default:'default.jpg',
  },
  password: {
    type: String,
    required: [true, "Please provide a  password"],
    minlength: 8,
    select: false,
  },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  passwordChangedAt: {
    type: Date,
    timestamps: true,
  },
  passwordConfirmation: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // this only works on nCREATE and SAVE
      validator: function (el) {
        return el === this.password; //abc===abc return true
      },
      message: "Passwords are not the same!",
    },
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  // only run this if password was actually modified
  if (!this.isModified("password")) {
    //.isModified is used to check whether a field is modified or not
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12); //encrypts the password
  //   Delete password Confirm field
  this.passwordConfirmation = undefined; //not to display password confirmation
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatepassword,
  userpassword // it is an instance method available on all the documents
) {
  return await bcrypt.compare(candidatepassword, userpassword); //compares the hashed password with the original password
};
userSchema.methods.changePassword = function (JWTtimestamp) {
  //this. gives all the objects associated with it
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // eslint-disable-next-line no-console
  
    // eslint-disable-next-line no-unneeded-ternary
    return JWTtimestamp < changedTimestamp ? true : false; //this return true :when password is changed after the token was issued,false:when password is not changed after token was issued
  }
  //False means not changed
  return false;
};
userSchema.methods.createpasswordresettoken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex"); //creates a token for reset

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex"); //this is an encrypted password reset token sent to the database
  // eslint-disable-next-line no-console
  
  // eslint-disable-next-line no-unused-expressions
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.pre(/^find/, function (next) {
  //this points to current query
  this.find({ active: { $ne: false } });
  next();
});
const User = mongoose.model("User", userSchema); //model variables are always started with capital letter
module.exports = User;
