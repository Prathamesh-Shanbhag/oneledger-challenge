// REQUIRES: {publicKey, rawTx, signature}, env
// RETURNS: {txHash, height}

async function broadcastTx({publicKey, rawTx, signature}, env) {
    const {request, requestConfig} = require('ons-SDK');

    const broadcastBody = {
        broadCastType: requestConfig.BroadcastType.Sync,
        rawTx: rawTx,
        signature: signature,
        publicKey: {
            keyType: requestConfig.PublicKeyTypes.publicKeyType,
            data: publicKey
        }
    };

    const {response} = await request.broadcastTx(broadcastBody, env).catch(error => {
        throw error;
    });

    const {txHash, height} = response;
    return { txHash, height };
}

module.exports = broadcastTx;