function makeGroupListSelect(groupList) {
  let arr = [];
  for (let k of Object.keys(groupList)) {
    arr.push({value: groupList[k].id, label: groupList[k].number})
  }
  return arr;
}

export {
  makeGroupListSelect,
}