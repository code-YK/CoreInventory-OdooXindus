"""
Hybrid Search Algorithm - Test Examples

This file demonstrates how the hybrid search algorithm works with practical examples.
Run these curl commands against a running CoreInventory API instance to test.
"""

# First, get an authentication token
# =================================

# Create a new user
curl -X POST "http://localhost:8000/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Response will include: {"access_token": "...", "token_type": "bearer"}
# Export the token
TOKEN="your_access_token_here"


# ============================================================================
# EXAMPLE 1: Basic Keyword Search - "nike"
# =================================
# Expected: Products with "nike" in name or SKU
#
# Results will include:
# - Keyword matches: 0.7-1.0 (substring, prefix, or exact)
# - Semantic matches: Products similar to "nike" > 0.5
# - Combined score: Average of both
# ============================================================================

curl -X GET "http://localhost:8000/products?search=nike" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Example Response:
# [
#   {
#     "id": "550e8400-e29b-41d4-a716-446655440000",
#     "name": "Nike Air Max 90",
#     "sku": "NIKE-AM90",
#     "search_scores": {
#       "keyword": 0.9,        ← Prefix match on name
#       "semantic": 0.85,      ← Similar to "nike"
#       "combined": 0.875      ← Average score (ranking key)
#     }
#   }
# ]


# ============================================================================
# EXAMPLE 2: Semantic Search - "athletic footwear"
# =================================
# Expected: Products semantically similar to athletic footwear
#
# "athletic footwear" might not match any keywords,
# but semantic search finds related products like:
# - Running shoes
# - Sports shoes
# - Athletic sneakers
# ============================================================================

curl -X GET "http://localhost:8000/products?search=athletic%20footwear" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Example Response:
# [
#   {
#     "id": "550e8400-e29b-41d4-a716-446655440001",
#     "name": "Nike Running Shoes Pro",
#     "sku": "NIKE-RSP",
#     "search_scores": {
#       "keyword": 0,           ← No keyword match
#       "semantic": 0.92,       ← High semantic similarity
#       "combined": 0.46        ← Still ranked (semantic score / 2)
#     }
#   }
# ]


# ============================================================================
# EXAMPLE 3: Filter Extraction - "nike shoes available"
# =================================
# Expected:
# 1. Extract filter: AvailabilityFilter.AVAILABLE (quantity > 0)
# 2. Search query cleaned: "nike shoes" (removed "available")
# 3. Return only products with quantity > 0
#
# Filter Keywords Detected:
# - "available" → AvailabilityFilter.AVAILABLE
# ============================================================================

curl -X GET "http://localhost:8000/products?search=nike%20shoes%20available" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Example Response (only products with quantity > 0):
# [
#   {
#     "id": "550e8400-e29b-41d4-a716-446655440000",
#     "name": "Nike Air Max 90",
#     "sku": "NIKE-AM90",
#     "search_scores": {
#       "keyword": 0.9,
#       "semantic": 0.85,
#       "combined": 0.875
#     }
#   }
#   # Shoes with quantity == 0 are filtered out
# ]


# ============================================================================
# EXAMPLE 4: Low Stock Filter - "adidas low stock"
# =================================
# Expected:
# 1. Extract filter: AvailabilityFilter.LOW_STOCK
# 2. Filter: quantity > 0 AND quantity < reorder_level
# 3. Return products below reorder threshold but not out of stock
# ============================================================================

curl -X GET "http://localhost:8000/products?search=adidas%20low%20stock" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Example Response:
# [
#   {
#     "id": "550e8400-e29b-41d4-a716-446655440002",
#     "name": "Adidas Ultraboost",
#     "sku": "ADIDAS-UB",
#     "reorder_level": 10,
#     # Current quantity: 5 (between 0 and reorder_level)
#     "search_scores": {
#       "keyword": 0.9,
#       "semantic": 0.88,
#       "combined": 0.89
#     }
#   }
# ]


# ============================================================================
# EXAMPLE 5: Out of Stock Filter - "nike out of stock"
# =================================
# Expected:
# 1. Extract filter: AvailabilityFilter.OUT_OF_STOCK
# 2. Filter: quantity == 0
# 3. Return only products with zero quantity
# ============================================================================

curl -X GET "http://localhost:8000/products?search=nike%20out%20of%20stock" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Example Response:
# [
#   {
#     "id": "550e8400-e29b-41d4-a716-446655440003",
#     "name": "Nike Air Force 1",
#     "sku": "NIKE-AF1",
#     # Current quantity: 0
#     "search_scores": {
#       "keyword": 0.85,
#       "semantic": 0.81,
#       "combined": 0.83
#     }
#   }
# ]


# ============================================================================
# EXAMPLE 6: Hybrid with Category Filter
# =================================
# Expected:
# 1. Search only within a specific category
# 2. Apply hybrid search to category results
# 3. Apply filters
# ============================================================================

curl -X GET "http://localhost:8000/products?search=running%20shoes&category_id=550e8400-e29b-41d4-a716-446655440010" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Example Response (only from specified category):
# [
#   {
#     "id": "550e8400-e29b-41d4-a716-446655440004",
#     "name": "Nike Running Pro",
#     "sku": "NIKE-RP",
#     "category_id": "550e8400-e29b-41d4-a716-446655440010",
#     "search_scores": {
#       "keyword": 0.9,
#       "semantic": 0.93,
#       "combined": 0.915
#     }
#   }
# ]


# ============================================================================
# EXAMPLE 7: No Search Query (Simple Listing)
# =================================
# Expected:
# 1. Return all active products (no search scores)
# 2. Hybrid algorithm not used
# 3. Fast response (no ML inference)
# ============================================================================

curl -X GET "http://localhost:8000/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Example Response (no search_scores field):
# [
#   {
#     "id": "550e8400-e29b-41d4-a716-446655440000",
#     "name": "Nike Air Max 90",
#     "sku": "NIKE-AM90",
#     "category_id": "550e8400-e29b-41d4-a716-446655440001",
#     "unit": "pcs",
#     "reorder_level": 10,
#     "is_active": true
#     # No search_scores
#   }
# ]


# ============================================================================
# UNDERSTANDING THE SCORES
# =================================
#
# keyword_score: 0.0 to 1.0
#   - 1.0: Product name/SKU exactly matches query
#   - 0.9: Query appears at start (prefix match): "Nike" in "Nike Air Max"
#   - 0.7: Query appears anywhere (substring): "ike" in "Nike"
#   - 0.0: No keyword match
#
# semantic_score: 0.0 to 1.0
#   - Uses AI embeddings to find similar meanings
#   - "athletic shoes" → matches "running shoes" with high score
#   - "footwear" → matches many shoe types
#   - Only included if score > 0.5 threshold
#   - 0.0: Below threshold or very different
#
# combined_score: 0.0 to 1.0
#   - Calculated as: (keyword_score + semantic_score) / 2
#   - Used for final ranking
#   - Product with highest combined_score appears first
#
# Example: Nike Air Max with "nike shoes"
#   - keyword: 0.9 (prefix match on "Nike")
#   - semantic: 0.85 (semantically similar)
#   - combined: (0.9 + 0.85) / 2 = 0.875 ← Top result
# ============================================================================


# ============================================================================
# FILTER KEYWORD REFERENCE
# =================================
#
# AVAILABLE (quantity > 0):
#   - "available"
#   - "in stock"
#   - "in-stock"
#
# LOW STOCK (0 < quantity < reorder_level):
#   - "low stock"
#   - "low-stock"
#   - "reorder"
#
# OUT OF STOCK (quantity == 0):
#   - "out of stock"
#   - "out-of-stock"
#   - "unavailable"
#
# NOISE WORDS (removed before search):
#   - "all", "show", "get", "display"
#
# Example: "show all nike shoes in stock and available"
# → Detected: "in stock" + "available" → AvailabilityFilter.AVAILABLE
# → Cleaned query: "nike shoes"
# → Applied: quantity > 0
# ============================================================================


# ============================================================================
# TESTING CHECKLIST
# =================================
#
# [ ] Test keyword search: "nike"
# [ ] Test semantic search: "athletic footwear"
# [ ] Test filter extraction: "nike available"
# [ ] Test low stock: "adidas low stock"
# [ ] Test out of stock: "puma out of stock"
# [ ] Test with category: "shoes" + category_id
# [ ] Test no search: "?category_id=xxx"
# [ ] Verify scores are ordered (highest first)
# [ ] Verify filters work correctly
# [ ] Check response time (should be < 1s for typical data)
# ============================================================================


# ============================================================================
# CURL HELPER: Save token and test
# =================================

#!/bin/bash
# Save as test_hybrid_search.sh and run: bash test_hybrid_search.sh

# Get token
RESPONSE=$(curl -X POST "http://localhost:8000/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
echo "Token: $TOKEN"

# Test 1: Keyword search
echo -e "\n=== Test 1: Keyword Search ==="
curl -X GET "http://localhost:8000/products?search=nike" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool

# Test 2: Semantic search
echo -e "\n=== Test 2: Semantic Search ==="
curl -X GET "http://localhost:8000/products?search=athletic%20footwear" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool

# Test 3: Filter extraction
echo -e "\n=== Test 3: Filter Extraction ==="
curl -X GET "http://localhost:8000/products?search=nike%20available" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool

# =================================

"""
