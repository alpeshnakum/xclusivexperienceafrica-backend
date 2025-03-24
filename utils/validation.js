function validateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

function generatePassword() {
    const length = 6;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
};

const calculateNetAmount = (totalAmount) => {
    const stripeFeePercentage = 0.029; // 2.9%
    const stripeFixedFee = 0.30; // $0.30
    const fee = (totalAmount * stripeFeePercentage) + stripeFixedFee;
    return totalAmount - fee;
};

module.exports = { validateAge, generateOTP, generatePassword, calculateNetAmount };