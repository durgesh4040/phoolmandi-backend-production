import crypto from 'crypto'

export function generateOtp() {
    const otp = crypto.randomInt(100000, 1000000);
    return otp;
}