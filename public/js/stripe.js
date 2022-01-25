/*eslint-disable*/
import axios from "axios";
import { showAlert } from "./alerts";
const stripe = Stripe(
  "pk_test_51KL7W5SAGfo0Dr9ET6Khmrba5PxIygVvrB94BB2xJCp0b9VY3JWDrOunRohvsuf8FVESXFMspj8XHmooqp6vA1dD00o4DMdpJY"
);

export const bookTour = async (tourId) => {
    try{
        //1)GET checkout session from our API
  const session = await axios(
    `http://localhost:3000/api/v1/booking/checkout-session/${tourId}`
  );
  console.log(session);
  //2)Create checkout form +charge credit card
  await stripe.redirectToCheckout({
      sessionId:session.data.session.id
  })
    }
    catch(err) {
        console.log(err)
        showAlert('error',err)
    }
  
};
