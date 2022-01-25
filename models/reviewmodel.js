const mongoose = require("mongoose");
const Tour = require("./tourmodel");

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review cannot be empty"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      timestamp: true,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour"],
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true }, //it creates a virtual property in model where these are not stored in database but we ccan get them
    toObject: { virtuals: true },
  }
);

reviewSchema.index({tour:1,user:1},{unique:true})

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //   path:"tour",
  //   select:"name"
  // }).populate({
  //   path:"user",
  //   select:"name photo"
  // })
  this.populate({
    path: "user",
    select: "name photo",
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //statics is used in this function to use this keyword which points to the model itself
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  // eslint-disable-next-line no-console
  // console.log(stats);
  if(stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  }else{
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage:4.5,
    });
  }
};
reviewSchema.post("save", function () {
  //function calcAverageRatings is called
  //this points to current review
  this.constructor.calcAverageRatings(this.tour); //this.constructor points to the model review
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  //Update and delete do not get access to the document middleware
  this.r = await this.findOne() //this refers to query not the model
  // console.log(this.r)
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  //Update and delete do not get access to the document middleware
  //await this.findOne();//this does not work here as the query is already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});
const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
//NOTE:
//for UPDATE AND DELETE OPERATIONS we only use query middleware and not document middleware