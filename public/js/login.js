/*eslint-disable*/
import axios from "axios";
import "@babel/polyfill";
import { showAlert } from "./alerts";
export const login = async (email, password) => {
  try {
    const res = await axios({
      method: "POST",
      url: "http://localhost:3000/api/v1/users/login",
      data: {
        //data represents the data passed to the body
        email: email,
        password: password,
      },
    });
    if (res.data.status === "success") {
      showAlert("success", "Logged in successfully");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
    console.log(res);
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "http://localhost:3000/api/v1/users/logout",
    });
    if (res.data.status == "success") location.reload(true); //location.reload(true is set to refresh the paage so that user will be logout)
  } catch (err) {
    showAlert("error", "error logging out! try again");
  }
};
