export const calculateQuotationScore = (quotation, allQuotationsWithVendors) => {
  // Configurable Weights
  const WEIGHT_PRICE = 0.50;
  const WEIGHT_DELIVERY = 0.25;
  const WEIGHT_RATING = 0.25;

  const minPrice = Math.min(...allQuotationsWithVendors.map(q => q.finalAmount));
  const minDelivery = Math.min(...allQuotationsWithVendors.map(q => q.deliveryDays));
  const maxRating = Math.max(...allQuotationsWithVendors.map(q => q.vendor?.rating || 0));

  const priceScore = quotation.finalAmount > 0 ? (minPrice / quotation.finalAmount) * 100 : 0;
  const deliveryScore = quotation.deliveryDays > 0 ? (minDelivery / quotation.deliveryDays) * 100 : 0;
  const ratingScore = quotation.vendor?.rating ? (quotation.vendor.rating / 5) * 100 : 50;

  const totalScore = (priceScore * WEIGHT_PRICE) + (deliveryScore * WEIGHT_DELIVERY) + (ratingScore * WEIGHT_RATING);

  const isLowestPrice = quotation.finalAmount === minPrice;
  const isFastestDelivery = quotation.deliveryDays === minDelivery;
  const isTopRated = quotation.vendor?.rating === maxRating && maxRating > 0;

  let aiReasoning = [];
  if (isLowestPrice) aiReasoning.push("offers the most cost-effective solution");
  if (isFastestDelivery) aiReasoning.push("guarantees the fastest delivery timeline");
  if (isTopRated) aiReasoning.push("maintains the highest historical reliability rating");
  
  let reasoningString = "This vendor provides a moderately balanced offering.";
  if (aiReasoning.length === 3) {
    reasoningString = "This is the objectively optimal choice, leading the market across all key metrics (price, speed, and reliability).";
  } else if (aiReasoning.length === 2) {
    reasoningString = `A strong strategic contender that ${aiReasoning[0]} and ${aiReasoning[1]}.`;
  } else if (aiReasoning.length === 1) {
    reasoningString = `Selected primarily because this vendor ${aiReasoning[0]}, though it may lag in other metrics.`;
  } else if (totalScore >= 75) {
    reasoningString = "Provides a highly balanced offering across all evaluated metrics despite not leading outright in any single category.";
  }

  return {
    score: Math.round(totalScore),
    isLowestPrice,
    isFastestDelivery,
    isTopRated,
    reasoning: reasoningString
  };
};
