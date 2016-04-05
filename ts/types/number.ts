var MIN_INTEGER = -100000000,
    MAX_INTEGER = 100000000;

import random = require('../core/random');
import string = require('./string');

function numberType(value) {
  if (value.faker || value.chance) {
    return string(value);
  }

  var multipleOf = value.multipleOf;

  var min = typeof value.minimum === 'undefined' ? MIN_INTEGER : value.minimum,
      max = typeof value.maximum === 'undefined' ? MAX_INTEGER : value.maximum;

  if (multipleOf) {
    max = Math.floor(max / multipleOf) * multipleOf;
    min = Math.ceil(min / multipleOf) * multipleOf;
  }

  if (value.exclusiveMinimum && value.minimum && min === value.minimum) {
    min += multipleOf || 1;
  }

  if (value.exclusiveMaximum && value.maximum && max === value.maximum) {
    max -= multipleOf || 1;
  }

  if (multipleOf) {
    return Math.floor(random.number(min, max) / multipleOf) * multipleOf;
  }

  if (min > max) {
    return NaN;
  }

  return random.number(min, max, undefined, undefined, true);
}

export = numberType;