# Hybrid Search Algorithm Implementation

## Overview

The CoreInventory API now includes a **hybrid search algorithm** that combines:
1. **Keyword Search** - Fast substring matching on product name and SKU
2. **Semantic Search** - AI-powered similarity matching using embeddings
3. **Dynamic Filter Extraction** - Intelligent parsing of user queries to extract availability filters
4. **Smart Merging** - Combines results from both search methods with deduplication
5. **Filter Application** - Applies extracted filters to final results

## Algorithm Flow

```
User Query: "all nike shoes available in db"
    │
    ├─ Step 1: Extract Filters (using Pydantic)
    │          "available" → AvailabilityFilter.AVAILABLE
    │          Query cleaned → "nike shoes"
    │
    ├─ Step 2: Keyword Search
    │          Match "nike" in product names/SKUs
    │          Score: 0.7-1.0 (based on match type)
    │
    ├─ Step 3: Semantic Search
    │          Embed "nike shoes" using sentence-transformers
    │          Find similar products (similarity > 0.5)
    │
    ├─ Step 4: Merge & Deduplicate
    │          Union keyword + semantic results
    │          Combine scores: (keyword_score + semantic_score) / 2
    │
    └─ Step 5: Apply Filters
               Filter by availability (quantity > 0)
               Return final results with scores
```

## Search Types and Scoring

### Keyword Search
Performs substring matching with weighted scoring:
- **Exact Match** (1.0): Product name or SKU exactly matches query
- **Prefix Match** (0.9): Query appears at start of name/SKU
- **Substring Match** (0.7): Query appears anywhere in name/SKU

Example:
```
Query: "nike"
Product 1: "Nike Air Max" (name starts with query) → 0.9
Product 2: "Adidas with Nike swoosh" (substring) → 0.7
Product 3: "nike" (exact SKU) → 1.0
```

### Semantic Search
Uses sentence transformers to find semantically similar products:
- Encodes query using "all-MiniLM-L6-v2" model (fast, lightweight)
- Calculates cosine similarity between query and product names
- Returns products with similarity > 0.5 threshold
- Similarity range: 0.0 (completely different) to 1.0 (identical)

Example:
```
Query: "athletic footwear"
Product 1: "Nike Running Shoes" → 0.87 (semantic match)
Product 2: "Running Shoes" → 0.92 (semantic match)
Product 3: "Shoe Rack" → 0.31 (below threshold, excluded)
```

## Filter Extraction

### Supported Keywords

**Availability Filters:**
- **AVAILABLE**: "available", "in stock", "in-stock"
- **LOW_STOCK**: "low stock", "low-stock", "reorder"
- **OUT_OF_STOCK**: "out of stock", "out-of-stock", "unavailable"
- **ANY** (default): No availability keyword found

**Noise Words** (removed before search):
- "all", "show", "get", "available", "in stock", "low stock", etc.

### Filter Extraction Example

```
Input: "all nike shoes available in db"
├─ Availability detected: "available"
├─ Extracted: AvailabilityFilter.AVAILABLE
├─ Query cleaned: "nike shoes"
└─ Filter: quantity > 0
```

## API Usage

### Request
```bash
curl -X GET "http://localhost:8000/products?search=nike%20shoes%20available" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### Query Parameters
- `search` (optional): Search query (uses hybrid algorithm)
- `category_id` (optional): Filter by category UUID
- `Authorization`: Bearer token (required)

### Response Format (with hybrid search)
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Nike Air Max 90",
    "sku": "NIKE-AM90",
    "category_id": "550e8400-e29b-41d4-a716-446655440001",
    "unit": "pcs",
    "reorder_level": 10,
    "is_active": true,
    "search_scores": {
      "keyword": 0.9,
      "semantic": 0.85,
      "combined": 0.875
    }
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Nike Running Shoes Pro",
    "sku": "NIKE-RSP",
    "category_id": "550e8400-e29b-41d4-a716-446655440001",
    "unit": "pcs",
    "reorder_level": 15,
    "is_active": true,
    "search_scores": {
      "keyword": 0.7,
      "semantic": 0.88,
      "combined": 0.79
    }
  }
]
```

### Response Format (without search)
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Nike Air Max 90",
    "sku": "NIKE-AM90",
    "category_id": "550e8400-e29b-41d4-a716-446655440001",
    "unit": "pcs",
    "reorder_level": 10,
    "is_active": true
  }
]
```

## Search Examples

### Example 1: Keyword + Semantic Match
```
Query: "nike shoes available"

Results:
1. Nike Air Max (keyword: 0.9, semantic: 0.86, combined: 0.88) ✅ Available
2. Nike Running Pro (keyword: 0.7, semantic: 0.92, combined: 0.81) ✅ Available
3. Nike Jacket (keyword: 0.85, semantic: 0.45, combined: 0.65) ✅ Available
```

### Example 2: Low Stock Filter
```
Query: "adidas low stock"

Algorithm:
1. Extract filter: AvailabilityFilter.LOW_STOCK
2. Clean query: "adidas"
3. Keyword search: "Adidas Ultraboost" (0.8)
4. Semantic search: "Adidas Running Shoe" (0.89)
5. Filter: quantity < reorder_level AND quantity > 0

Results:
- Adidas Ultraboost (qty: 5, reorder: 10) ✅
- Adidas Boost Pro (qty: 3, reorder: 20) ✅
- Adidas Stan Smith (qty: 0, reorder: 5) ❌ (qty == 0)
```

### Example 3: Out of Stock Filter
```
Query: "shoes out of stock"

Algorithm:
1. Extract filter: AvailabilityFilter.OUT_OF_STOCK
2. Clean query: "shoes"
3. Semantic similarity matching
4. Filter: quantity == 0

Results:
- Nike Air Force (qty: 0) ✅
- Adidas Stan Smith (qty: 0) ✅
- Nike Air Max (qty: 5) ❌
```

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Keyword Search | O(n) | Linear scan through products |
| Semantic Encoding | O(1) | Single query embedding |
| Semantic Similarity | O(n) | Matrix multiplication |
| Merging | O(n log n) | Sorting by combined score |
| Total (typical) | ~200-500ms | Depends on product count |

### Optimization Strategies

1. **Lazy Model Loading**: Semantic model loads only when needed
2. **Efficient Deduplication**: Uses dictionary-based merge
3. **Single Pass Filtering**: Filters applied in one iteration
4. **Threshold-based Culling**: Only processes semantic matches > 0.5

## Configuration

### Semantic Search Threshold
Currently set to **0.5** in `product_service.py:66`

```python
search_result = hybrid_engine.hybrid_search(
    query=search,
    products=enriched_products,
    semantic_threshold=0.5  # Adjust sensitivity here
)
```

**Threshold Guide:**
- **0.3-0.4**: Very permissive (more false positives)
- **0.5-0.6**: Balanced (recommended)
- **0.7-0.8**: Strict (fewer results, higher precision)
- **0.9+**: Very restrictive (only highly relevant)

### Semantic Model
Currently using: **all-MiniLM-L6-v2**
- Size: 33M parameters
- Speed: ~0.2s per batch of 128 products
- Accuracy: Good for product names
- Alternative: "all-mpnet-base-v2" (better but slower)

## Technical Details

### Dependencies
- `sentence-transformers==2.2.2` - Semantic embeddings
- `scikit-learn==1.3.2` - Similarity calculations
- `numpy==1.24.3` - Numerical operations

### Files Modified
1. `backend/app/utils/search.py` - Core hybrid search implementation
2. `backend/app/services/product_service.py` - Integration with product listing
3. `backend/requirements.txt` - Added dependencies

### Data Flow

```
ListProducts Router (products.py)
    ↓
ProductService.list_products()
    ├─ Query active products
    ├─ Apply category filter
    ├─ If search:
    │  ├─ Enrich with inventory
    │  ├─ HybridSearchProcessor.hybrid_search()
    │  │  ├─ Extract filters
    │  │  ├─ Keyword search
    │  │  ├─ Semantic search
    │  │  ├─ Merge results
    │  │  └─ Apply filters
    │  └─ Return with scores
    └─ Else: Return without scores
```

## Backward Compatibility

✅ **Fully backward compatible**
- Endpoints unchanged
- Request format unchanged
- Response format enhanced (scores only when search provided)
- No breaking changes to other APIs

## Future Enhancements

1. **Caching**: Cache embeddings for frequently searched queries
2. **Personalization**: Track user search patterns for relevance
3. **Synonyms**: Expand queries with product synonyms
4. **Category Awareness**: Boost scores for category-relevant results
5. **Recent History**: Factor in recently purchased items
6. **A/B Testing**: Compare different threshold values
7. **Fine-tuning**: Train custom embeddings on product names

## Troubleshooting

### Semantic Model Not Loading
```
Warning: Could not load semantic search model: ...
```
Solution: Ensure `sentence-transformers` is installed
```bash
pip install sentence-transformers==2.2.2
```

### No Results Despite Query Match
Check:
1. Product exists and is active (`is_active == true`)
2. Semantic threshold not too high (default 0.5 is reasonable)
3. Query keywords correctly mapped to availability filter

### Slow Search Performance
1. Check product count (scales linearly)
2. Consider increasing semantic threshold to filter earlier
3. Pre-warm the semantic model on startup (optional)

---

**Implementation Date**: 2024
**Algorithm Type**: Hybrid (Keyword + Semantic)
**Search Scope**: Product name, SKU
**Filter Types**: Availability (available, low_stock, out_of_stock)
