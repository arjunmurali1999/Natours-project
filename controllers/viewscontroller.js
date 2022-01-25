const Tour = require("../models/tourmodel");
const Booking=require("../models/bookingModel")
const catchAsync = require("../utils/catchasync");
const AppError = require("../utils/appError");
const User=require("../models/usermodel")

exports.getOverview = catchAsync(async (req, res, next) => {
  //1) Get Tour data from collection
  const tours = await Tour.find();
  //2)Build templated
  //3)Render the template using the data from the collection
  res.status(200).render("overview", {
    title: "All Tours",
    tours,
  });
});

exports.gettour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });
  if (!tour) {
    return next(new AppError("There is no tour with that name", 404));
  }
  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;"//very important while u use external cdn this line need to be writtent
    )
    .render("tour", {
      title: tour.name,
      tour,
    });
});

exports.login = catchAsync(async (req, res, next) => {
  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .render("login", {
      title: "Log into your account",
    });
});

exports.getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your Account",
  });
};

exports.updateUserData = async(req, res, next) => {
  const updatedUser=await User.findByIdAndUpdate(req.user.id,{
    name:req.body.name,
    email:req.body.email,
  },{
    new :true,
    runValidators:true,
  });
  res.status(200).render("account", {
    title: "Your Account",
    user:updatedUser
  });
};

exports.getMyTours=catchAsync(async(req,res,next)=>{
  //1)Find all bookings
  const bookings=await Booking.find({user:req.user.id})
  //2)Find tours with the returned IDs
  const tourIDs=bookings.map(el=>el.tour)
  const tours= await Tour.find({_id:{$in: tourIDs}}) //tourIDs is an array so in operator is used to select the id based on the tourIDs array
  res.status(200).render('overview',{
    title:'My Tours',
    tours
  })
})
exports.signup = catchAsync(async (req, res, next) => {
  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .render("signup", {
      title: "Create your account",
    });
});