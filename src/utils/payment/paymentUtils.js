const { BANK_ACCOUNTS } = require('./constants');

const calculateFees = (consultationFee, paymentMethod) => {
    const taxRate = 0.11; // 11% tax
    const platformFeeRate = paymentMethod === 'MIDTRANS' ? 0.029 : 0.025; // 2.9% for Midtrans, 2.5% for others
    
    const platformFee = Math.round(consultationFee * platformFeeRate);
    const tax = Math.round(consultationFee * taxRate);
    const totalAmount = consultationFee + platformFee + tax;
  
    return {
      baseAmount: consultationFee,
      platformFee,
      tax,
      totalAmount
    };
  };

const generatePaymentGuide = (paymentMethod, bankCode = null) => {
  switch (paymentMethod) {
    case 'BANK_TRANSFER':
      const bank = BANK_ACCOUNTS[bankCode] || BANK_ACCOUNTS.MANDIRI;
      return {
        bankInfo: bank,
        steps: [
          `Transfer ke rekening ${bank.bankName}`,
          `Nomor rekening: ${bank.accountNumber}`,
          `Atas nama: ${bank.accountHolder}`,
          'Upload bukti transfer',
          'Tunggu verifikasi pembayaran (1x24 jam)'
        ]
      };
    case 'QRIS':
      return {
        steps: [
          'Scan QRIS code menggunakan mobile banking atau e-wallet',
          'Pastikan nominal sesuai',
          'Lakukan pembayaran',
          'Verifikasi Pembayaran oleh Dokter (Fast Response)'
        ]
      };
    default:
      return { steps: [] };
  }
};

module.exports = {
  calculateFees,
  generatePaymentGuide
};