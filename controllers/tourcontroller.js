const multer = require("multer");
const sharp = require("sharp");
const Tour = require("../models/tourmodel");
const catchAsync = require("../utils/catchasync");
const factory = require("./handlerfactory");
const AppError = require("../utils/appError");

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

exports.uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);
// upload.single('name') to upload a single image
//upload.array('names',6) to upload a list of images

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  //1)Cover Image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.body.imageCover}`);
  next();

  //2)images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.body.imageCover}`);
      req.body.images.push(filename);
    })
  );
  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

exports.getalltours = factory.getall(Tour);
// exports.getalltours = catchAsync(async (req, res, next) => {
//   // EXECUTE QUERY
//   const features = new APIfeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;
//   // query.sort().select().limit().skip()

//   // SEND RESPONSE
//   res.status(200).json({
//     status: "success",
//     requestedAt: req.requestTime,
//     data: {
//       tours,
//     },
//   });
// });

exports.gettour = factory.getOne(Tour, {
  path: "reviews",
  select: "review",
});

// exports.gettour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate({
//     path: "reviews",
//     select: "review",
//   }); //.populate only fills the data of guides in the query and not in the database(populate on back uses query to get the desired data from the database so on large applications it will have effect)
//   // Tour.findOne({ id:req.params.id})
//   if (!tour) {
//     //same as tour==null
//     return next(new AppError("no tour found with that id", 404));
//   }
//   res.status(200).json({
//     status: "success",
//     data: {
//       tour,
//     },
//   });
// });

exports.createtour = factory.createOne(Tour);

// exports.createtour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: "success",
//     data: {
//       tour: newTour,
//     },
//   });
// });
exports.updatetour = factory.UpdateOne(Tour);

// exports.updatetour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });
//   if (!tour) {
//     //same as tour==null
//     return next(new AppError("no tour found with that id", 404));
//   }
//   res.status(200).json({
//     status: "success",
//     data: {
//       tour,
//     },
//   });
// });

exports.deleteTour = factory.deleteone(Tour);
// exports.deletetour = catchAsync(async (req, res, next) => {
//   // eslint-disable-next-line no-unused-vars
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     //same as tour==null
//     return next(new AppError("no tour found with that id", 404));
//   }
//   res.status(204).json({
//     status: "success",
//   });
// });
exports.deleteallTour = catchAsync(async (req, res, next) => {
  await Tour.remove();
  res.status(204).json({});
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        // _id:'$ratingsAverage',
        numTours: { $sum: 1 },
        numRating: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match:{_id:{$ne:'easy'}}
    // }
  ]);
  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; //2021
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, lating, unit } = req.params; //destructurin is used to get all the variables at once
  const coordinates = lating.split(",");
  const lat = coordinates[0];
  const lng = coordinates[1];
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1; //mogodb expects radius to be in radians
  if (!lat || !lng) {
    return next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng",
        400
      )
    );
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }, //geospatial queries are used to find documents within the given latitude and longitude
  });
  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { lating, unit } = req.params; //destructurin is used to get all the variables at once
  const coordinates = lating.split(",");
  const lat = coordinates[0];
  const lng = coordinates[1];
  if (!lat || !lng) {
    return next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng",
        400
      )
    );
  }
  const multiplier = unit === "mi" ? 0.0006213 : 0.001;
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          //geonear takes in property callednear which takes the coordinates of the start location
          type: "Point",
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      data: distances,
    },
  });
});
