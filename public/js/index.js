/*eslint-disable*/
import "@babel/polyfill";
import { displayMap } from "./mapbox";
import { login, logout } from "./login";
import {signup} from "./signup"
import { updateUser } from "./updateSettings";
import {bookTour} from './stripe'

//DOM ELEMENTS
const mapBox = document.getElementById("map");
const loginForm = document.querySelector(".form--login");
const logOutBtn = document.querySelector(".nav__el--logout");
const updatesettingsBtn = document.querySelector(".form-user-data");
const userpasswordForm = document.querySelector(".form-user-password");
const bookBtn=document.getElementById('book-tour')
const signupForm=document.querySelector('.form--signup')
//VALUES

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault(); //stops from loading the page
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });
}
if(signupForm)
{ 
  console.log('clicked')
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name=document.getElementById("name").value;
    const email=document.getElementById("email").value;
    const password=document.getElementById("password").value;
    const passwordConfirmation=document.getElementById("passwordConfirmation").value;
    signup(name, email, password, passwordConfirmation)
  })
}

if (logOutBtn) logOutBtn.addEventListener("click", logout);

if (updatesettingsBtn) {
  updatesettingsBtn.addEventListener("submit", (e) => {
    const form =new FormData()
    e.preventDefault();
    form.append('name',document.getElementById('name').value)
    form.append('email',document.getElementById('email').value)
    form.append('photo',document.getElementById('photo').files[0])
    console.log(form)
    updateUser(form, "data");
  });
}
if (userpasswordForm) {
  userpasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    // document.querySelector("btn--save-password").textContent ="Updating...";
    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirmation =
      document.getElementById("password-confirm").value;
    await updateUser(
      { passwordCurrent, password, passwordConfirmation },
      "password"
    );
    // document.querySelector("btn--save-password").textContent = "Save Password";
    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";
  });
}
if(bookBtn)
{ 
  bookBtn.addEventListener("click",e=>{
    e.target.textContent='Processing..'
    const {tourId}=e.target.dataset;
    bookTour(tourId);
  })
}