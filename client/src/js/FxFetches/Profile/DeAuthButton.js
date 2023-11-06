import myfetch from "../myfetch";

async function deauth(setVkData, setGroupNumber, setGroupId, setGroupList, setGroupSchedule) {
  await myfetch('/api/auth/deauth', {method: "POST"} )
  localStorage.clear();
  setVkData({});
  setGroupId(null);
  setGroupList(null);
  setGroupNumber(null);
  setGroupSchedule(null);
}

export {
  deauth,
}