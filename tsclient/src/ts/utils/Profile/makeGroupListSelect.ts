import { Igroup } from "../../types/stores/GroupTypes";

function makeGroupListSelect(groupList: Igroup[] | null): {value: number, label: string}[] {
  if (!groupList) {
    return [];
  }

  let arr: {value: number, label: string}[] = [];
  Object.values(groupList).forEach((group: Igroup) => {
    arr.push({value: group.group_id, label: group.number})
  })
  return arr;
}

export {
  makeGroupListSelect,
}
