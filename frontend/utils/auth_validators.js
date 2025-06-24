// Generate age from birth date
export function generate_age(born) {
    let birth_date = new Date(born);
    let current_date = new Date();
    return current_date.getFullYear() - birth_date.getFullYear();
}

// Check password validity
export function isValidPassword(password, confirmation) {
    return password === confirmation && password.length >= 8;
}

// Check email validity
export function isValidEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}
