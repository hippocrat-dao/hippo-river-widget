import { fromBech32, toBech32, fromHex, toHex } from '@cosmjs/encoding'

export const ethToEthermint = (ethAddress: string, prefix: string) => {
  const data = fromHex(ethAddress.replace("0x", ""))
  return toBech32(prefix, data)
}

export const ethermintToEth = (ethermintAddress: string) => {
  const { data } = fromBech32(ethermintAddress)
  return `0x${toHex(data)}`
}

export function decimal2percent(v?: string) {
    return v ? parseFloat((Number(v) * 100).toFixed(2)) : ''
}

export function base64ToHex(base64String) {
  try {
    // Decode the Base64 string to a binary string.
    const binaryString = atob(base64String);

    // Convert the binary string to a hexadecimal string.
    let hexString = '';
    for (let i = 0; i < binaryString.length; i++) {
      const hex = binaryString.charCodeAt(i).toString(16).padStart(2, '0');
      hexString += hex;
    }

    return hexString;
  } catch (error) {
    console.error('Error decoding Base64:', error);
    return null; // Or throw the error, depending on your needs.
  }
}

