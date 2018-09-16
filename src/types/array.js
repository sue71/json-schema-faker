import random from '../core/random';
import utils from '../core/utils';
import ParseError from '../core/error';
import optionAPI from '../api/option';

// TODO provide types
function unique(path, items, value, sample, resolve, traverseCallback) {
  const tmp = [];
  const seen = [];

  function walk(obj) {
    const json = JSON.stringify(obj);

    if (seen.indexOf(json) === -1) {
      seen.push(json);
      tmp.push(obj);
    }
  }

  items.forEach(walk);

  // TODO: find a better solution?
  let limit = 100;

  while (tmp.length !== items.length) {
    walk(traverseCallback(value.items || sample, path, resolve));

    if (!limit) {
      limit -= 1;
      break;
    }
  }

  return tmp;
}

// TODO provide types
function arrayType(value, path, resolve, traverseCallback) {
  const items = [];

  if (!(value.items || value.additionalItems)) {
    if (utils.hasProperties(value, 'minItems', 'maxItems', 'uniqueItems')) {
      throw new ParseError(`missing items for ${utils.short(value)}`, path);
    }
    return items;
  }

  // see http://stackoverflow.com/a/38355228/769384
  // after type guards support subproperties (in TS 2.0) we can simplify below to (value.items instanceof Array)
  // so that value.items.map becomes recognized for typescript compiler
  const tmpItems = value.items;

  if (tmpItems instanceof Array) {
    return Array.prototype.concat.call(items, tmpItems.map((item, key) => {
      const itemSubpath = path.concat(['items', key]);

      return traverseCallback(item, itemSubpath, resolve);
    }));
  }

  let minItems = value.minItems;
  let maxItems = value.maxItems;

  if (optionAPI('minItems')) {
    // fix boundaries
    minItems = !maxItems
      ? optionAPI('minItems')
      : Math.min(optionAPI('minItems'), maxItems);
  }

  if (optionAPI('maxItems')) {
    // Don't allow user to set max items above our maximum
    if (maxItems && maxItems > optionAPI('maxItems')) {
      maxItems = optionAPI('maxItems');
    }

    // Don't allow user to set min items above our maximum
    if (minItems && minItems > optionAPI('maxItems')) {
      minItems = maxItems;
    }
  }

  const optionalsProbability = optionAPI('alwaysFakeOptionals') === true ? 1.0 : optionAPI('optionalsProbability');

  const length = (maxItems != null && optionalsProbability)
    ? Math.round(maxItems * optionalsProbability)
    : random.number(minItems, maxItems, 1, 5);

  // TODO below looks bad. Should additionalItems be copied as-is?
  const sample = typeof value.additionalItems === 'object' ? value.additionalItems : {};

  for (let current = items.length; current < length; current += 1) {
    const itemSubpath = path.concat(['items', current]);
    const element = traverseCallback(value.items || sample, itemSubpath, resolve);

    items.push(element);
  }

  if (value.uniqueItems) {
    return unique(path.concat(['items']), items, value, sample, resolve, traverseCallback);
  }

  return items;
}

export default arrayType;
