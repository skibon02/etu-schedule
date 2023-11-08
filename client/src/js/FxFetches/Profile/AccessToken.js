import myfetch from "../myfetch";

async function accessTokenUpdate(token, setAccessToken) {
  let response = await myfetch(`/api/AcessToken/update/${token}`);
  let data = await response.json();
  setAccessToken(data);
}

async function accessTokenDelete(setAccessToken) {
  let response = await myfetch('/api/accessToken/delete/');
  if (response.ok) {
    setAccessToken(null);
  }
}

export {
  accessTokenUpdate,
  accessTokenDelete,
}