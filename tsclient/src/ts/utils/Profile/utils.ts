import { GroupTokenService } from "../../services/GroupTokenService";
import { Igroup } from "../../types/stores/GroupTypes";
import { groupOptionType } from "../../types/tsx/Profile/UserPreferencesTypes";

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

function groupFilterOptions(option: groupOptionType, value: string) {
  return option.label.toLowerCase().indexOf(value.toLowerCase()) === 0
}
function handleEnterUp(inputV: string, e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Enter') {
    GroupTokenService.attendanceTokenSetFetch(inputV);
  }
}

export {
  makeGroupListSelect,
  groupFilterOptions,
  handleEnterUp
}