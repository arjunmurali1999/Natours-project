const mongoose = require("mongoose");
const slugify = require("slugify");
// const validator = require("validator");
// const User = require("./usermodel")

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "tour must have name"],
      unique: true, //not a validator
      trim: true,
      maxlength: [40, "A tour name must have less or equal to 40 characters"],
      minlength: [10, "A tour name must have greter or equal to 10 characters"],
      // validate: [validator.isAlpha, "tour name must only contain characters"],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "tour must have duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "tour must have  group size"],
    },
    difficulty: {
      type: String,
      required: [true, "tour must have difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"], //enum is only for Strings
        message: " Difficulty is either easy medium or difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "rating must be above 1"],
      max: [5, "rating must be below 5"],
      set:val=>Math.round(val*10)/10 //set function runs whenever a new ratingsAverage is set
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "tour must have price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to the current doc on NEW document creation
          return val < this.price;
        },
        message: "Discount price ({VALUE}) should be below the regular price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "tour must have summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "tour must havea cover image"],
    },
    images: [String],
    createAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //Geo JSON format
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      //EMBEDDED DOCUMENTS is always created inside the array
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId, //type:this accepts only the objectid
        ref: "User", //referenced to User table
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
tourSchema.index({startLocation:'2dsphere'})//startlocation is indexed to 2d sphere as it is located in the earth 
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

tourSchema.index({ price: 1 ,ratingsAverage:-1}); //with index we sort the price in ascending or descending order
//indexes are done to the fields which are queried the most
//Virtual populate
tourSchema.index({slug:1})

tourSchema.virtual("reviews", {
  ref: "Review", //table which is been referenced
  foreignField: "tour", //connecting to tour in Review table
  localField: "_id",
});

// DOCUMENT MIDDLEWARE:runs before .save() and .create()
tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
// tourSchema.pre('save',async function (next) {//this is a embedding method where we use ids of the guides to retreive the data from user documents
//   const guidesPromises=this.guides.map(async id=>await User.findById(id)) //async function always returns promises
//  this.guides= await Promise.all(guidesPromises)//Promise.all is used to get the promises
//   next();
// })

// tourSchema.post("save", (doc, next) => {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides", //path to which the values need to be populated
    select: "-__v -passwordChangedAt",
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  // eslint-disable-next-line no-console
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre("aggregate", function (next) {
  
  if(Object.keys(this.pipeline()[0])==="$geoNear")
  {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  // eslint-disable-next-line no-console
  next();
  }
  next();
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
