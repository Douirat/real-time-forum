export function throttle(fn, delay) {
    let isThrottled = false;

    return function (...args) {
        if (isThrottled) return;

        isThrottled = true;
        fn.apply(this, args);

        setTimeout(() => {
            isThrottled = false;
        }, delay);
    };
}
