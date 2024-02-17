function groupFilterOptions(o, v) {
  return o.label.toLowerCase().indexOf(v.toLowerCase()) === 0
}

export {
  groupFilterOptions,
}
