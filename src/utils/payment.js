const calculateFees = (baseAmount) => {
    const platformFeePercentage = 0.05; // 5%
    const platformFee = baseAmount * platformFeePercentage;
    
    return {
      baseAmount,
      platformFee,
      totalAmount: baseAmount + platformFee
    };
  };
  
  module.exports = { calculateFees };