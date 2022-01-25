const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/usermodel");
const catchAsync = require("../utils/catchasync");
const AppError = require("../utils/appError");
const factory = require("./handlerfactory");

// const multerStorage=multer.diskStorage({
//   destination:(req,file,cb)=>{
//     cb(null,'public/img/users')
//   },
//   filename:(req,file,cb)=>{
//     const ext=file.mimetype.split('/')[1]
//     cb(null,`user-${req.user.id}-${Date.now()}.${ext}`)
//   }
// })

const multerStorage = multer.memoryStorage(); //in this image is stored as buffer
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image!Please upload only images", 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto =catchAsync(async(req, res, next) => {
  if (!req.file) return next();

  req.file.filename=`user-${req.user.id}-${Date.now()}.jpeg`

 await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
    next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getme = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getallusers = factory.getall(User);
// exports.getallusers = catchAsync(async (req, res) => {
//   const users = await User.find();
//   res.status(200).json({
//     status: "success",
//     data: {
//       users: users,
//     },
//   });
// });

exports.updateme = catchAsync(async (req, res, next) => {
  //1)Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirmation) {
    return next(
      new AppError(
        "This route is not for password updates.Please use /updatepassword ",
        401
      )
    );
  }

  //2)Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, "name", "email");
  if (req.file) filteredBody.photo = req.file.filename; //if the body contains photo then we are uploading the photo name tothe database
  //3)update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.createallusers = (req, res) => {
  res.status(200).json({
    status: "error",
    message: "This route is not defined !Please use signup instead",
  });
};
exports.getuser = factory.getOne(User);
//Do NOT Upadate the password with this
exports.updateuser = factory.UpdateOne(User);
exports.deleteuser = factory.deleteone(User);
