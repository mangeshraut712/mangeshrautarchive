import Decimal from '../vendor/decimal.js';

const D = Decimal.clone({ precision: 40, maxE: 1000, minE: -1000 });
const NUMBER = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
const ZONES = {
  'new york': 'America/New_York',
  'new york city': 'America/New_York',
  nyc: 'America/New_York',
  philadelphia: 'America/New_York',
  boston: 'America/New_York',
  chicago: 'America/Chicago',
  denver: 'America/Denver',
  'los angeles': 'America/Los_Angeles',
  'san francisco': 'America/Los_Angeles',
  seattle: 'America/Los_Angeles',
  phoenix: 'America/Phoenix',
  london: 'Europe/London',
  paris: 'Europe/Paris',
  berlin: 'Europe/Berlin',
  india: 'Asia/Kolkata',
  pune: 'Asia/Kolkata',
  mumbai: 'Asia/Kolkata',
  delhi: 'Asia/Kolkata',
  kolkata: 'Asia/Kolkata',
  dubai: 'Asia/Dubai',
  singapore: 'Asia/Singapore',
  tokyo: 'Asia/Tokyo',
  sydney: 'Australia/Sydney',
  auckland: 'Pacific/Auckland',
  utc: 'UTC',
  gmt: 'UTC',
};
const UNITS = new Map();
function unit(aliases, dimension, factor, label) {
  for (const alias of aliases.split('|')) UNITS.set(alias, { dimension, factor, label });
}
unit('m|meter|meters|metre|metres', 'length', '1', 'm');
unit('km|kilometer|kilometers|kilometre|kilometres', 'length', '1000', 'km');
unit('cm|centimeter|centimeters|centimetre|centimetres', 'length', '0.01', 'cm');
unit('mm|millimeter|millimeters', 'length', '0.001', 'mm');
unit('in|inch|inches', 'length', '0.0254', 'in');
unit('ft|foot|feet', 'length', '0.3048', 'ft');
unit('yd|yard|yards', 'length', '0.9144', 'yd');
unit('mi|mile|miles', 'length', '1609.344', 'mi');
unit('kg|kilogram|kilograms|kilo|kilos', 'mass', '1', 'kg');
unit('g|gram|grams', 'mass', '0.001', 'g');
unit('mg|milligram|milligrams', 'mass', '0.000001', 'mg');
unit('lb|lbs|pound|pounds', 'mass', '0.45359237', 'lb');
unit('oz|ounce|ounces', 'mass', '0.028349523125', 'oz (mass)');
unit('s|sec|second|seconds', 'duration', '1', 'seconds');
unit('min|minute|minutes', 'duration', '60', 'minutes');
unit('h|hr|hour|hours', 'duration', '3600', 'hours');
unit('day|days', 'duration', '86400', 'days');
unit('week|weeks', 'duration', '604800', 'weeks');
unit('l|liter|liters|litre|litres', 'volume', '1', 'L');
unit('ml|milliliter|milliliters|millilitre|millilitres', 'volume', '0.001', 'mL');
unit('us gallon|us gallons', 'volume', '3.785411784', 'US gal');
unit('imperial gallon|imperial gallons', 'volume', '4.54609', 'Imperial gal');
for (const [name, aliases] of Object.entries({
  C: 'c|°c|celsius',
  F: 'f|°f|fahrenheit',
  K: 'k|kelvin',
})) {
  for (const alias of aliases.split('|'))
    UNITS.set(alias, { dimension: 'temperature', label: name });
}

function result(answer, category) {
  return {
    answer,
    type: 'utility',
    category,
    source: 'local-utility',
    sourceLabel: 'On-device calculation',
    model: 'Local tools',
    timestamp: Date.now(),
  };
}
function display(value) {
  if (!value.isFinite()) throw new Error('That calculation has no finite real-number result.');
  const rounded = value.toSignificantDigits(15);
  return `${rounded.eq(value) ? '' : '≈ '}${rounded.toString()}`;
}

// Bounded arithmetic grammar, never JavaScript evaluation or arbitrary functions.
export function calculate(expression) {
  if (expression.length > 200)
    throw new Error('Please use a shorter calculation (up to 200 characters).');
  const tokens = expression.match(/(?:\d+(?:\.\d*)?|\.\d+)|[()+\-*/^%]/g) || [];
  if (tokens.join('') !== expression.replace(/\s/g, '') || tokens.length > 100)
    throw new Error('Use numbers, parentheses, +, −, ×, ÷, ^, or %.');
  let position = 0;
  function primary() {
    const token = tokens[position++];
    let value;
    if (token === '(') {
      value = sum();
      if (tokens[position++] !== ')') throw new Error('Check the parentheses in that calculation.');
    } else if (/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token || '')) value = new D(token);
    else throw new Error('That expression is incomplete. Please check the numbers and operators.');
    while (tokens[position] === '%') {
      position++;
      value = value.div(100);
    }
    return value;
  }
  function power() {
    const value = primary();
    if (tokens[position] !== '^') return value;
    position++;
    const exponent = unary();
    if (!exponent.isInteger() || exponent.abs().gt(1000))
      throw new Error('Use a whole-number exponent between −1000 and 1000.');
    if (value.isZero() && exponent.isZero()) throw new Error('0^0 is indeterminate here.');
    const powered = value.pow(exponent);
    if (!value.isZero() && powered.isZero())
      throw new Error('That result is too small for the supported calculation range.');
    return powered;
  }
  function unary() {
    if (tokens[position] === '+') {
      position++;
      return unary();
    }
    if (tokens[position] === '-') {
      position++;
      return unary().neg();
    }
    return power();
  }
  function product() {
    let value = unary();
    while (['*', '/'].includes(tokens[position])) {
      const operator = tokens[position++];
      const right = unary();
      if (operator === '/' && right.isZero()) throw new Error('Division by zero is undefined.');
      value = operator === '*' ? value.times(right) : value.div(right);
    }
    return value;
  }
  function sum() {
    let value = product();
    while (['+', '-'].includes(tokens[position])) {
      const operator = tokens[position++];
      const right = product();
      value = operator === '+' ? value.plus(right) : value.minus(right);
    }
    return value;
  }
  const value = sum();
  if (position !== tokens.length)
    throw new Error('Use an explicit operator between numbers and parentheses.');
  return display(value);
}

function clock(query, now, localZone) {
  const match = query.match(
    /^(?:(?:what(?:'s| is|s)?|tell me)\s+)?(?:the\s+)?(?:current\s+)?(time|date)(?:\s+(?:is it|now|today))?(?:\s+in\s+(.+?))?(?:\s+(?:right now|now|today))?$/i
  );
  if (!match) return null;
  const place = match[2]?.trim();
  let zone = place ? ZONES[place.toLowerCase()] : localZone;
  if (!zone && place?.includes('/')) zone = place;
  if (!zone)
    return result(
      'Which city or IANA timezone do you mean? For example, New York or America/New_York.',
      'time'
    );
  try {
    const date = new Date(now);
    const format = {
      timeZone: zone,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    if (match[1].toLowerCase() === 'time') {
      format.hour = 'numeric';
      format.minute = '2-digit';
      format.timeZoneName = 'short';
    }
    const formatted = new Intl.DateTimeFormat('en-US', format).format(date);
    return result(`**${formatted}** — ${place || zone}.\n\nBased on your device clock.`, 'time');
  } catch {
    return result(
      'I could not resolve that timezone. Use a city such as New York or an IANA name such as America/New_York.',
      'time'
    );
  }
}

function convert(query) {
  const match = query.match(
    new RegExp(
      `^(?:(?:convert|what(?:'s| is|s))\\s+)?(${NUMBER})\\s*([a-z° ]+?)\\s+(?:to|in|into)\\s+([a-z° ]+)$`,
      'i'
    )
  );
  if (!match) return null;
  const from = UNITS.get(match[2].trim().toLowerCase());
  const to = UNITS.get(match[3].trim().toLowerCase());
  if (!from || !to)
    return result(
      'Please specify supported, unambiguous units, such as kg to lb, miles to km, Celsius to Fahrenheit, or US gallons to liters. Currency exchange requires a current rate; I won’t invent one.',
      'conversion'
    );
  if (from.dimension !== to.dimension)
    return result(
      'Those units measure different quantities and cannot be converted directly.',
      'conversion'
    );
  let value = new D(match[1]);
  if (from.dimension === 'temperature') {
    let kelvin =
      from.label === 'K'
        ? value
        : from.label === 'C'
          ? value.plus('273.15')
          : value.minus(32).times(5).div(9).plus('273.15');
    if (kelvin.isNegative())
      return result(
        'That temperature is below absolute zero. Please check the value or unit.',
        'conversion'
      );
    value =
      to.label === 'K'
        ? kelvin
        : to.label === 'C'
          ? kelvin.minus('273.15')
          : kelvin.minus('273.15').times(9).div(5).plus(32);
  } else value = value.times(from.factor).div(to.factor);
  return result(`${match[1]} ${from.label} = **${display(value)} ${to.label}**`, 'conversion');
}

function calendarDays(query) {
  const match = query.match(
    /^(?:how many )?days between (\d{4}-\d{2}-\d{2}) and (\d{4}-\d{2}-\d{2})$/i
  );
  if (!match) return null;
  const dates = match.slice(1).map(value => new Date(`${value}T00:00:00Z`));
  if (
    dates.some(
      (date, index) =>
        !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== match[index + 1]
    )
  ) {
    return result('Use valid dates in YYYY-MM-DD format.', 'date');
  }
  const days = Math.abs(dates[1] - dates[0]) / 86400000;
  return result(
    `**${days} days** between ${match[1]} and ${match[2]} (elapsed calendar days, excluding the starting day).`,
    'date'
  );
}

/** Return null for ordinary chat; never guess an unsupported utility result. */
export function answerLocalUtility(
  input,
  { now = Date.now(), timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone } = {}
) {
  if (typeof input !== 'string' || input.length > 1800) return null;
  const query = input
    .trim()
    .replace(/[?!.]+$/, '')
    .replace(/\s+/g, ' ');
  const time = clock(query, now, timeZone);
  if (time) return time;
  try {
    const days = calendarDays(query);
    if (days) return days;
    const root = query.match(
      new RegExp(`^(?:what(?:'s| is|s)\\s+)?(?:sqrt|square root of)\\s*\\(?(${NUMBER})\\)?$`, 'i')
    );
    if (root)
      return result(
        `Square root of ${root[1]} = **${display(new D(root[1]).sqrt())}**`,
        'calculation'
      );
    const tip = query.match(
      new RegExp(`^(?:calculate\\s+)?(${NUMBER})\\s*%\\s+tip on\\s+(${NUMBER})$`, 'i')
    );
    if (tip) {
      const amount = new D(tip[2]);
      const extra = amount.times(tip[1]).div(100);
      if (amount.isNegative() || extra.isNegative())
        return result('Use non-negative amounts and tip percentages.', 'calculation');
      return result(
        `Tip: **${display(extra)}**. Total: **${display(amount.plus(extra))}**, in the same units as your amount.`,
        'calculation'
      );
    }
    const conversion = convert(query);
    if (conversion) return conversion;
    const percentage = query.match(
      new RegExp(
        `^(?:what(?:'s| is|s)\\s+)?(${NUMBER})\\s*(?:%|percent)\\s+of\\s+(${NUMBER})$`,
        'i'
      )
    );
    if (percentage)
      return result(
        `${percentage[1]}% of ${percentage[2]} = **${display(new D(percentage[1]).times(percentage[2]).div(100))}**`,
        'calculation'
      );
    if (/^\d{4}-\d{2}-\d{2}$/.test(query)) return null;
    const expression = query
      .replace(/^(?:what(?:'s| is|s)|calculate|compute|work out)\s+/i, '')
      .replace(/\*\*/g, '^')
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\bplus\b/gi, '+')
      .replace(/\bminus\b/gi, '-')
      .replace(/\btimes\b/gi, '*')
      .replace(/\bdivided by\b/gi, '/')
      .replace(/\s+x\s+/gi, '*');
    if (
      /^[\d\s.()+*/^%-]+$/.test(expression) &&
      /\d/.test(expression) &&
      /[+*/^%-]/.test(expression)
    )
      return result(`${expression} = **${calculate(expression)}**`, 'calculation');
    return null;
  } catch (error) {
    return result(error.message, 'calculation');
  }
}
