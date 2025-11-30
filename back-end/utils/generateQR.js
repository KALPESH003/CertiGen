const QRCode = require('qrcode');

/**
 * Generates a QR Code as a Data URL (Base64)
 * @param {string} text - The data to encode (usually the Verification URL)
 * @returns {Promise<string>} - The Data URL string (e.g., "data:image/png;base64,iVBOR...")
 */
const generateQR = async (text) => {
    try {
        // Options for better scan-ability and aesthetics
        const opts = {
            errorCorrectionLevel: 'H', // High error correction (allows logo in middle if needed later)
            type: 'image/jpeg',
            quality: 0.9,
            margin: 1,
            color: {
                dark: '#000000',  // Black dots
                light: '#FFFFFF'  // White background
            }
        };

        const qrImage = await QRCode.toDataURL(text, opts);
        return qrImage;

    } catch (err) {
        console.error('❌ QR Generation Error:', err);
        throw new Error('Failed to generate QR Code');
    }
};

module.exports = generateQR;