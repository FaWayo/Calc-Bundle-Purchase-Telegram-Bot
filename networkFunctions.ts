import axios from "axios";
import { GetTokenPayload} from "./types";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";

const jar = new CookieJar()
const client = wrapper(axios.create({jar}))


export async function getToken() {
  let token: string = "";
  const payload: GetTokenPayload = {
    userName: `${process.env.TBOT_USERNAME}`,
    userPassword: `${process.env.TBOT_PASSWORD}`,
  };
  await client
    .post(`${process.env.GET_TOKEN_API}`, payload)
    .then((res) => {
      token = res.data;
      console.log(token, "res from getToken")
    })
    .catch((err) => {
      console.log(err, "getTokenError")
      err
    })
  return token
}

export async function postRequest(url: string, payload: any, token: string) {
  let response: any = null 
  await client.post(`${url}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
       Accept: "*/*",
    }
  }).then(res => response = res)
  .catch(err => {return err})
  return response
}

export async function getRequest(url: string, token: string) {
  let response: any = null
  await client.get(`${url}`,  {
   headers: {
    Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
       Accept: "*/*",
   }
  }).then(res => response = res)
  .catch(err => {return err})
  return response
}


