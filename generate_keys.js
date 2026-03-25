const crypto = require('crypto');

function generateVapidKeys() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'prime256v1'
    });

    const pubDer = publicKey.export({ type: 'spki', format: 'der' });
    const privDer = privateKey.export({ type: 'pkcs8', format: 'der' });

    // VAPID keys are the raw coordinates.
    // Public key: 0x04 + X (32 bytes) + Y (32 bytes) = 65 bytes
    const pubRaw = pubDer.slice(-65);
    // Private key: the d value (32 bytes)
    const privRaw = privDer.slice(-32);

    const toBase64Url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    console.log('PUBLIC_KEY=' + toBase64Url(pubRaw));
    console.log('PRIVATE_KEY=' + toBase64Url(privRaw));
}

try {
    generateVapidKeys();
} catch (e) {
    console.error('Error generating keys:', e.message);
}
