export const sleep = ms => new Promise(res => setTimeout(res, ms));

export const getCmdLineVars = (inputs = process.argv) => {
    return inputs
        .slice(2)
        .map((input) => {
            input = input.slice(2).split('=');
            return {
                [input[0]]: input[1] || true
            };
        })
        .reduce((prev, curr) => {
            Object.assign(prev, curr);
            return prev;
        }, {});
}