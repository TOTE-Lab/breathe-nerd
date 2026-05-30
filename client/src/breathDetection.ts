/*
    Threshold Function 
    -> How to know if sounds is user breathing or background noise - if breath is above a certain volume threshold it will be detected 
        GIVEN an array of volume samples from the mic
        FIND the loudest 20% of those samples
        AVERAGE them to get the peak volume
        RETURN 60% of that peak as the trigger threshold
        IF the array is empty return a safe default of 30
*/

export function computeThreshold(volumeSamples: number[]): number {
    //if no volume samples were collected return a safe default - if something goes wrong and there was no sound this prevents the application from breaking
    if(volumeSamples.length === 0) return 30 

    //we are only going to use the top 20% loudest volume samples - sort the array in the order of loudest/biggest to the most quiet/smallest
    
    //we use the spread operator to create a copy of the original array rather than mutating directly 
    const sorted = [...volumeSamples].sort((a, b) => b - a)

    //take the top 20% (the loudest samples) from the sorted array - make sure you test at least one audio sample
    const topSlice = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.2)))

    //average the top samples to get the peak volume of the sample array
    const avg = topSlice.reduce((sum, v) => sum + v, 0) / topSlice.length 

    //return the threshold volume - high enough to ignore noise, low enough to catch real breaths
    return Math.round(avg * 0.6)
}

//checks if enough time has been passed since the last breath was detected 
//returns true if it's too soon to register a breath and false if enough time has passed 
//once a breath is detected ignore everything for the next 800ms before you start listening again 
export function shouldDebounce(lastBreathMs: number, nowMs: number, debounceMs = 800): boolean {
    return nowMs - lastBreathMs < debounceMs
}