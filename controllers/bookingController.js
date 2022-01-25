const stripe=require("stripe")(process.env.STRIPE_SECRET_KEY)
const Tour = require("../models/tourmodel");
const catchAsync = require("../utils/catchasync");
const factory = require("./handlerfactory");
const Booking=require("../models/bookingModel")

exports.getCheckoutsession=catchAsync(async(req,res,next) => {
    //1)get the currently booked tour
    const tour=await Tour.findById(req.params.tourId)
    //2)Create checkout session
const session=await stripe.checkout.sessions.create({  //all these comes from stripe options and not our own fields
    payment_method_types:['card'],
    success_url:`${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url:`${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email:req.user.email,
    client_reference_id:req.params.tourId,
    line_items:[{   //product info user gonna purchase
        name:`${tour.name}Tour`,
        description:tour.summary,
        images:[`https://www.natours.dev/img/tours/tour-1-cover.jpg`],
        amount:tour.price*100,
        currency:'usd',
        quantity:1,
    }]
})
 //3)Create session as response
res.status(200).json({
    status: 'success',
    session
})
})
exports.createBookingCheckout=catchAsync(async(req,res,next) => {
    //This is only Temporary because anyone can book without booking
const {tour,user,price}=req.query
if(!tour && !user && !price) return next()
await Booking.create({tour,user,price})
res.redirect(req.originalUrl.split('?')[0]) //req.OriginalUrl contains the current URL
})

exports.getBookingDetails=factory.getall(Booking)
exports.getBooking=factory.getOne(Booking)
exports.updateBookingDetails=factory.UpdateOne(Booking)
exports.deleteBookingDetails=factory.deleteone(Booking)