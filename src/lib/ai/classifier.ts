import { ParsedItem } from './gemini';
import { Database } from '@/types/database';

type Supplier = Database['public']['Tables']['suppliers']['Row'];

export interface ClassifiedItem extends ParsedItem {
    supplier_id: string | null;
    classification_confidence: number;
}

/**
 * Classify items to suppliers based on category and keywords
 */
export function classifyItemsBySupplier(
    items: ParsedItem[],
    suppliers: Supplier[]
): ClassifiedItem[] {
    return items.map(item => {
        let bestMatch: Supplier | null = null;
        let maxScore = 0;

        for (const supplier of suppliers) {
            let score = 0;

            // 1. Category Match (Base score: 0.5)
            if (item.category && supplier.category === item.category) {
                score += 0.5;
            }

            // 2. Keyword Match (Boost score: +0.4)
            // Check if product name contains any custom keyword
            if (supplier.custom_keywords && supplier.custom_keywords.length > 0) {
                const normalizedProduct = item.product.toLowerCase();
                const hasKeywordMatch = supplier.custom_keywords.some(keyword =>
                    normalizedProduct.includes(keyword.toLowerCase())
                );

                if (hasKeywordMatch) {
                    score += 0.4;
                }
            }

            // Update best match if this supplier has a higher score
            if (score > maxScore) {
                maxScore = score;
                bestMatch = supplier;
            }
        }

        // Threshold for assignment
        // If score is low (e.g. < 0.3), we might leave it unassigned
        const ASSIGNMENT_THRESHOLD = 0.3;
        const assignedSupplier = maxScore >= ASSIGNMENT_THRESHOLD ? bestMatch : null;

        return {
            ...item,
            supplier_id: assignedSupplier?.id || null,
            classification_confidence: maxScore,
        };
    });
}
