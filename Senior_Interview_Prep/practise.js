const twoSums = (array, target) => {
    let namMaps = new Map();
    for (let i = 0; i < array.length; i++) {
        let complaint = target - array[i];
        if (namMaps.has(complaint)) {
            return [namMaps.get(complaint), i];
        }
        namMaps.set(array[i], i);
    }
    return [];
}

console.log(twoSums([2, 7, 11, 15], 9)); // Output: [0, 1]
console.log(twoSums([3, 2, 4], 6)); // Output: [1, 2]
console.log(twoSums([3, 3], 6)); // Output: [0, 1]