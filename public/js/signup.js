/*eslint-disable*/
import axios from "axios";
import "@babel/polyfill";
import { showAlert } from "./alerts";

export const signup=async(name,email,password,passwordConfirmation)=>{
    try{
        const res=await axios({
            method: 'POST',
            url:'/api/v1/users/signup',
            data:{
                name,
                email,
                password,
                passwordConfirmation
            }
        })
        if(res.data.status==="success")
        {
            showAlert('success',"Your account is successfully created")
            window.setTimeout(()=>{
                location.assign('/')
            },1500)
        }
    }
    catch(err){
        showAlert("error", err.response.data.message);
    }
}