/**
 * Utility to generate a PIX Static Payload (Copia e Cola)
 * Following EMV QRCPS (Merchant Presented Mode) standards for Brazil's PIX.
 */

function crc16(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function generatePixPayload(key: string, amount: number, city: string = 'BRASILIA', name: string = 'BARBEARIA'): string {
  // 00: Payload Format Indicator
  let payload = '000201';
  
  // 26: Merchant Account Information - PIX
  const gui = 'BR.GOV.BCB.PIX';
  const keyInfo = `01${key.length.toString().padStart(2, '0')}${key}`;
  const merchantAccountInfo = `00${gui.length.toString().padStart(2, '0')}${gui}${keyInfo}`;
  payload += `26${merchantAccountInfo.length.toString().padStart(2, '0')}${merchantAccountInfo}`;
  
  // 52: Merchant Category Code
  payload += '52040000';
  
  // 53: Transaction Currency (986 = BRL)
  payload += '5303986';
  
  // 54: Transaction Amount
  const amountStr = amount.toFixed(2);
  payload += `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
  
  // 58: Country Code
  payload += '5802BR';
  
  // 59: Merchant Name
  const cleanName = name.substring(0, 25).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  payload += `59${cleanName.length.toString().padStart(2, '0')}${cleanName}`;
  
  // 60: Merchant City
  const cleanCity = city.substring(0, 15).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  payload += `60${cleanCity.length.toString().padStart(2, '0')}${cleanCity}`;
  
  // 62: Additional Data Field Template
  payload += '62070503***';
  
  // 63: CRC16
  payload += '6304';
  payload += crc16(payload);
  
  return payload;
}
