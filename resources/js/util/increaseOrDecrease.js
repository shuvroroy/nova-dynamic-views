/**
 * @param {number} currentValue
 * @param {number} startingValue
 * @returns {boolean|null}
 */
export default function increaseOrDecrease(currentValue, startingValue) {
  if (startingValue === 0) {
    return null
  }

  if (currentValue > startingValue) {
    return ((currentValue - startingValue) / Math.abs(startingValue)) * 100
  } else {
    return ((startingValue - currentValue) / Math.abs(startingValue)) * -100
  }
}
