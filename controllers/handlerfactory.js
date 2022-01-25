const catchAsync = require("../utils/catchasync");
const AppError = require("../utils/appError");
const APIfeatures = require("../utils/apiFeatures");

exports.deleteone = (Model) =>
  catchAsync(async (req, res, next) => {
    // eslint-disable-next-line no-unused-vars
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      //same as tour==null
      return next(new AppError("no tour found with that id", 404));
    }
    res.status(204).json({
      status: "success",
    });
  });

exports.UpdateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      //same as tour==null
      return next(new AppError("no tour found with that id", 404));
    }
    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        tour: newDoc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError(`no document found with that id`, 404));
    }
    res.status(200).json({
      status: "success",
      data: {
        doc,
      },
    });
  });

exports.getall = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // EXECUTE QUERY
    const features = new APIfeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query
    // query.sort().select().limit().skip()

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      requestedAt: req.requestTime,
      data: {
        doc,
      },
    });
  });
