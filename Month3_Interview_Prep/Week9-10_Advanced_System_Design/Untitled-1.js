const reverseString = (string) => {
    let reversed = string.split('').reverse().join('');
    return reversed;
}


console.log(reverseString('sachin'));


const bestTimeToBuyAndSellStock = (prices) => {
    let minPrice = prices[0];
    let maxProfit = 0;
    for (let i = 1; i < prices.length; i++) {
        if (prices[i] < minPrice) {
            minPrice = prices[i];
        } else {
            maxProfit = Math.max(maxProfit, prices[i] - minPrice);
        }       

    }
    return maxProfit;
}

const ProductOfArrayExceptSelf = (nums) => {
    const result = new Array(nums.length).fill(1);
    let leftProduct = 1;
 for (let i = 0; i < nums.length; i++) {
        result[i] *= leftProduct;
        leftProduct *= nums[i];
    }

    let rightProduct = 1;
    for (let i = nums.length - 1; i >= 0; i--) {
        result[i] *= rightProduct;
        rightProduct *= nums[i];
    }


}


const maxSubArray = (nums) => {
    let maxSum = nums[0];
    let currentSum = nums[0];
    for (let i = 1; i < nums.length; i++) {
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }   
    return maxSum;
}


const roatedArray = (nums, k) => {
    k = k % nums.length;
    reverse(nums, 0, nums.length - 1);  
    reverse(nums, 0, k - 1);
    reverse(nums, k, nums.length - 1);
    return nums;
}

const reverse = (nums, start, end) => {
    while (start < end) {
        let temp = nums[start]; 
        nums[start] = nums[end];
        nums[end] = temp;
        start++;
        end--;
    }       
}

console.log(roatedArray([1,2,3,4,5,6,7], 3));


const findMinmumInRotatedSortedArray = (nums) => {
    let left = 0;
    let right = nums.length - 1;
    while (left < right) {
        let mid = Math.floor((left + right) / 2);   
        if (nums[mid] > nums[right]) {
            left = mid + 1;
        } else {
            right = mid;
        }   
    }
    return nums[left];

}

console.log(findMinmumInRotatedSortedArray([3,4,5,1,2]));


const findminimumInRotatedSortedArray = (nums) => {
    let left = 0;
    let right = nums.length - 1;
    while (left < right) {
        let mid = Math.floor((left + right) / 2);   
        if (nums[mid] > nums[right]) {
            left = mid + 1;
        } else {
            right = mid;
        }   
    }
    return nums[left];
}

const searchInRotatedSortedArray = (nums, target) => {
    let left = 0;
    let right = nums.length - 1;


    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        if (nums[mid] === target) {
            return mid;
        }
        if (nums[left] <= nums[mid]) {
            if (nums[left] <= target && target < nums[mid]) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        } else {
            if (nums[mid] < target && target <= nums[right]) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
    }
    return -1;
}


const containerWithMostWater = (height) => {
    let left = 0;
    let right = height.length - 1;
    let maxArea = 0;
    while (left < right) {
        let width = right - left;
        let currentArea = Math.min(height[left], height[right]) * width;
        maxArea = Math.max(maxArea, currentArea);   
        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }   
    }
    return maxArea;

}

const threeSum = (nums) => {
    nums.sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) {
            continue;
        }
        let left = i + 1;
        let right = nums.length - 1;
        while (left < right) {
            const sum = nums[i] + nums[left] + nums[right];
            if (sum === 0) {
                result.push([nums[i], nums[left], nums[right]]);
                while (left < right && nums[left] === nums[left + 1]) {
                    left++;
                }   
                while (left < right && nums[right] === nums[right - 1]) {
                    right--;
                }
                left++;
                right--;
            } else if (sum < 0) {
                left++;
            } else {
                right--;
            }   
        }
    }
}