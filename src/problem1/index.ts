function sumToNumberWithGaussFormula(n: number): number {
    return (n * (n + 1)) / 2;
}

function sumToNumberWithLoop(n: number): number {
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
}

function sumToNumberWithArrayReduce(n: number): number {
    return Array.from({length: 10}, (el, index) => index + 1).reduce((a, b) => a + b, 0);
}