import myfetch from "../myfetch";

async function accessTokenUpdate(token, setAccessToken) {
  let response = await myfetch(`/api/AcessToken/update/${token}`);
  let data = await response.json();
  setAccessToken(data);
}


export {
  accessTokenUpdate,
}