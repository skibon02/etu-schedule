type OptionType = { value: string; label: string; };
function groupFilterOptions(option: OptionType, value: string) {
  return option.label.toLowerCase().indexOf(value.toLowerCase()) === 0
}

export {
  groupFilterOptions,
}
