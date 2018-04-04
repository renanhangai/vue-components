vue-select
===========================

Select component


### Props ###
- `items`

  The options for the select, can be any of the types below:
  - `null`: The dropdown will show a loading message
  - `Array`: Array of objects or strings containing the options
  - `String`: Message to appear on the dropdown
  - `Function`: A function that receives the search string and may return any of the above, or a promise that resolves to any of the above types.
  
- `placeholder`

  The placeholder when no field is selected

- `multiple`

  `Boolean` flag to allow multiple selected values (default: false)

- `search`

  `Boolean` flag to show the search field or not (default: true)
