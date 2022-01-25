/*eslint-disable*/
import axios from 'axios';
import { showAlert } from "./alerts";
//type is either data or object
export const updateUser = async (data,type) => {
  try {
    const url=type==='password'? '/api/v1/users/updatepassword':'/api/v1/users/updateme'
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    if (res.data.status === "success") {
      showAlert("success", `${type.toUpperCase()} Updated successfully`);
    }
  } catch (err) {
    // console.log('found')
    showAlert("error", err.response.data.message);
  }
};
