/*
  UNIT TESTS for breathDetection.ts

  A unit test checks that a function does what we expect it to do
  We call the function with a known input and check the output matches what we expected
  If it does the test passes - if it doesn't the test fails and we know something is broken

  computeThreshold tests:
    - given an empty array it should return a safe default above 0
    - given samples with peaks around 100 it should return a threshold around 60% of that
    - given very loud samples it should never return zero

  shouldDebounce tests:
    - given a breath that happened too recently it should return true (still debouncing)
    - given a breath that happened long enough ago it should return false (ready for next breath)
*/

//describe - groups tests together - like a label for a set of related tests
//it - is one single test
//expect - how you check the result, the actual result v.s expectations
import { describe, it, expect } from 'vitest'
import { computeThreshold, shouldDebounce } from './breathDetection'

//tests for the threshold function from the breathDetection logic 
describe('computeThreshold', () => {
    //test -> doesn't return an error when the audio sample array has no data
    it('returns a safe default for an empty array', () => {
        //when the audio sample array is empty return our default volume/number
        expect(computeThreshold([])).toBeGreaterThan(0)
    })
    //test -> the threshold volume is around the 60% mark of the loudness of the topmost 20% samples from the audio array
    it('returns threshold around 60% of average peak', () => {
        const samples = [10, 12, 95, 100, 105, 98, 11, 9]
        const threshold = computeThreshold(samples)
        expect(threshold).toBeGreaterThan(50)
        expect(threshold).toBeLessThan(75)
    })
    //test -> the function should never return 0
    it('never returns zero for loud samples', () => {
        expect(computeThreshold([200, 210, 205])).toBeGreaterThan(0)
    })
})

//tests the shouldDebounce function from breathDetection 
describe('shouldDebounce', () => {
    //test -> the function correctly identifies when a breath was too recent
    it('returns true when last breath was too recent', () => {
        expect(shouldDebounce(500, 1000, 800)).toBe(true)
    })
    //test -> when enough time has passed to register a new one
    it('returns false when enough time has passed', () => {
        expect(shouldDebounce(100, 1000, 800)).toBe(false)
    })
    it('returns false when enough time has passed', () => {
        expect(shouldDebounce(100, 1000, 800)).toBe(false)
    })
})

