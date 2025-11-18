// app/lib/promo-utils.ts
export interface TreatmentWithPromo {
  _id: string;
  name: string;
  base_price: number;
  final_price?: number;
  applied_promo?: {
    _id: string;
    name: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
  };
  active_promos?: any[];
}

export function calculateTreatmentPrice(treatment: any): TreatmentWithPromo {
  console.log('🔄 Calculating price for treatment:', treatment.name);
  console.log('  📦 Input treatment:', {
    base_price: treatment.base_price,
    final_price: treatment.final_price,
    applied_promo: treatment.applied_promo,
    active_promos_count: treatment.active_promos?.length
  });

  // If the API already calculated final_price and applied_promo, use it
  if (treatment.final_price !== undefined && treatment.applied_promo !== undefined) {
    console.log('  ✅ Using API-calculated price');
    return treatment;
  }

  // Fallback: Calculate manually if API didn't provide the calculation
  let finalPrice = treatment.base_price;
  let appliedPromo = null;

  if (treatment.active_promos && treatment.active_promos.length > 0) {
    console.log('  🔍 Calculating manually from active_promos');
    let bestPrice = treatment.base_price;
    let bestPromo: any = null;

    treatment.active_promos.forEach((promo: any) => {
      if (!promo || !promo.is_active) return;

      let discountedPrice = treatment.base_price;
      
      if (promo.discount_type === 'percentage') {
        discountedPrice = Math.round(treatment.base_price * (1 - promo.discount_value / 100));
      } else if (promo.discount_type === 'fixed') {
        discountedPrice = Math.max(0, treatment.base_price - promo.discount_value);
      }

      console.log(`  💰 ${promo.name}: ${treatment.base_price} -> ${discountedPrice}`);

      if (discountedPrice < bestPrice) {
        bestPrice = discountedPrice;
        bestPromo = promo;
      }
    });

    if (bestPromo && bestPrice < treatment.base_price) {
      finalPrice = bestPrice;
      appliedPromo = {
        _id: bestPromo._id,
        name: bestPromo.name,
        discount_type: bestPromo.discount_type,
        discount_value: bestPromo.discount_value
      };
      console.log('  ✅ Applied promo:', appliedPromo.name);
    }
  }

  const result = {
    ...treatment,
    final_price: finalPrice,
    applied_promo: appliedPromo
  };

  console.log('  🎯 Final result:', {
    base_price: result.base_price,
    final_price: result.final_price,
    has_promo: !!result.applied_promo
  });

  return result;
}