/* eslint-disable prettier/prettier */
const path= require('path')
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongosanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser=require("cookie-parser");

const app = express();
app.set('view engine','pug')
app.set('views',path.join(__dirname,'views'))
const helmet = require("helmet");
const AppError = require("./utils/appError");
const errorhandler = require("./controllers/errorcontroller");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoute");
const reviewrouter=require('./routes/reviewRoute')
const viewrouter=require('./views/viewRoutes')
const bookingrouter=require("./routes/bookingRoutes")
// const tourController = require('C:/Users/Arjun/OneDrive/Desktop/edurekha/Backend/nodeproject/starter/controllers/tourcontrolle');
// const userController = require('C:/Users/Arjun/OneDrive/Desktop/edurekha/Backend/nodeproject/starter/controllers/usercontroller');
//GLOBAL Middlewares
//1)Set security HTTP Headers
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'http:', 'data:'],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
    },
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
//Limit requests from the same API
const limiter = rateLimit({
  //with express rate limit package the brute force attack is not possible
  max: 100,
  windowsMs: 60 * 60 * 1000,
  message: "Too many request from this IP ,Please try again after an hour",
});

app.use("/api", limiter); //app.use() is used for all middleware functions

//Body parser,reading data from the req.body
app.use(express.json({ limit: "10kb" }));

app.use(express.urlencoded({extended: true,limit: "10kb" })); //middleware which parses the data coming from the form

app.use(cookieParser());
//Data sanitization against noSQL query injection
app.use(mongosanitize());

//data sanitization against html
app.use(xss());

//Prevent parameter pollution (removes the duplicates in the parameters)
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);
app.use(express.static(path.join(__dirname, 'public')));//express.static  served from the folder called static
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// app.post('/api/v1/tours',createtour);
// app.patch('/api/v1/tours/:id',updatetour)
// app.delete('/api/v1/tours/:id',deletetour);

// ROUTES
app.use('/',viewrouter)
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use('/api/v1/reviews',reviewrouter)
app.use('/api/v1/booking',bookingrouter)

//it checks whether our route is correct or not
app.all("*", (req, res, next) => {
  next(new AppError(`Cant find the ${req.originalUrl} on this server`, 404));
});

app.use(errorhandler);
module.exports = app;
