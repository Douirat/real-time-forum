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

export function isNearBottom(threshold = 0.95) {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    return scrollTop + windowHeight >= documentHeight * threshold;
}