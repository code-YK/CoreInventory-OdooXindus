"""
Hybrid Search Algorithm combining Keyword Search and Semantic Search

Algorithm Flow:
1. Parse user query to extract filters (using Pydantic)
2. Run keyword search (ILIKE on name/SKU)
3. Run semantic search (embedding similarity > 0.5)
4. Merge & deduplicate results
5. Apply extracted filters to final results
"""

from typing import List, Optional, Tuple, Set
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer, util
import re
from enum import Enum


class AvailabilityFilter(str, Enum):
    """Availability filter extracted from query"""
    AVAILABLE = "available"  # quantity > 0
    LOW_STOCK = "low_stock"  # quantity < reorder_level
    OUT_OF_STOCK = "out_of_stock"  # quantity == 0
    ANY = "any"  # all items


class ProductSearchFilters(BaseModel):
    """
    Pydantic model to extract filters from user query.
    Automatically detects keywords and maps to filters.
    """
    availability: AvailabilityFilter = Field(
        default=AvailabilityFilter.ANY,
        description="Filter by availability: available, low_stock, out_of_stock"
    )
    is_active: bool = Field(
        default=True,
        description="Only return active products (soft delete awareness)"
    )

    class Config:
        use_enum_values = False


class SemanticSearchEngine:
    """
    Semantic search engine using sentence transformers.
    Encodes product names and calculates similarity scores.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize semantic search engine with a lightweight model.
        Model: all-MiniLM-L6-v2 (33M params, fast inference)
        """
        try:
            self.model = SentenceTransformer(model_name)
            self.model_loaded = True
        except Exception as e:
            print(f"Warning: Could not load semantic search model: {e}")
            self.model_loaded = False

    def get_embedding(self, text: str):
        """Get embedding for a text string"""
        if not self.model_loaded:
            return None
        return self.model.encode(text, convert_to_tensor=True)

    def calculate_similarity(self, query_embedding, product_embeddings) -> List[float]:
        """
        Calculate cosine similarity between query and products.
        Returns similarity scores (0-1) for each product.
        """
        if not self.model_loaded or query_embedding is None:
            return []
        return util.pytorch_cos_sim(query_embedding, product_embeddings)[0].cpu().tolist()

    def semantic_search(
        self,
        query: str,
        products: List[dict],
        threshold: float = 0.5
    ) -> List[dict]:
        """
        Perform semantic search on products.
        Returns products with similarity > threshold.

        Args:
            query: User search query
            products: List of product dicts with 'name' field
            threshold: Minimum similarity score (0-1)

        Returns:
            List of products with similarity scores, sorted by relevance
        """
        if not self.model_loaded or not products:
            return []

        # Get query embedding
        query_embedding = self.get_embedding(query)

        # Get product name embeddings
        product_names = [p.get("name", "") for p in products]
        product_embeddings = self.model.encode(product_names, convert_to_tensor=True)

        # Calculate similarities
        similarities = self.calculate_similarity(query_embedding, product_embeddings)

        # Filter by threshold and create results
        results = []
        for i, (product, similarity) in enumerate(zip(products, similarities)):
            if similarity >= threshold:
                results.append({
                    **product,
                    "semantic_score": float(similarity),
                    "search_type": "semantic"
                })

        # Sort by similarity descending
        results.sort(key=lambda x: x["semantic_score"], reverse=True)
        return results


class HybridSearchProcessor:
    """
    Main processor for hybrid search combining keyword and semantic search.
    Handles filter extraction, merging, and deduplication.
    """

    def __init__(self, semantic_engine: Optional[SemanticSearchEngine] = None):
        """Initialize with optional semantic search engine"""
        self.semantic_engine = semantic_engine or SemanticSearchEngine()

    def extract_filters_from_query(self, query: str) -> ProductSearchFilters:
        """
        Extract filters from user query using regex pattern matching.

        Recognizes keywords like:
        - "available": sets availability to AVAILABLE
        - "low stock": sets availability to LOW_STOCK
        - "out of stock": sets availability to OUT_OF_STOCK

        Args:
            query: User search query string

        Returns:
            ProductSearchFilters with extracted filter values
        """
        query_lower = query.lower()
        availability = AvailabilityFilter.ANY

        # Check for availability keywords
        if any(word in query_lower for word in ["available", "in stock", "in-stock"]):
            availability = AvailabilityFilter.AVAILABLE
        elif any(word in query_lower for word in ["low stock", "low-stock", "reorder"]):
            availability = AvailabilityFilter.LOW_STOCK
        elif any(word in query_lower for word in ["out of stock", "out-of-stock", "unavailable"]):
            availability = AvailabilityFilter.OUT_OF_STOCK

        return ProductSearchFilters(
            availability=availability,
            is_active=True
        )

    def keyword_search(
        self,
        query: str,
        products: List[dict],
        search_fields: List[str] = ["name", "sku"]
    ) -> List[dict]:
        """
        Perform keyword search using substring matching.
        Case-insensitive partial matching.

        Args:
            query: Search query
            products: List of product dicts
            search_fields: Fields to search in

        Returns:
            List of matching products with keyword_score
        """
        if not query or not products:
            return []

        query_lower = query.lower()
        results = []

        for product in products:
            # Check if query appears in any search field
            match_score = 0.0
            matched_fields = []

            for field in search_fields:
                field_value = str(product.get(field, "")).lower()
                if query_lower in field_value:
                    # Boost score if exact match or at word boundary
                    if query_lower == field_value:
                        match_score = max(match_score, 1.0)  # Exact match
                    elif field_value.startswith(query_lower):
                        match_score = max(match_score, 0.9)  # Prefix match
                    elif query_lower in field_value:
                        match_score = max(match_score, 0.7)  # Substring match
                    matched_fields.append(field)

            if match_score > 0:
                results.append({
                    **product,
                    "keyword_score": match_score,
                    "search_type": "keyword",
                    "matched_fields": matched_fields
                })

        # Sort by keyword score descending
        results.sort(key=lambda x: x["keyword_score"], reverse=True)
        return results

    def merge_and_deduplicate(
        self,
        keyword_results: List[dict],
        semantic_results: List[dict]
    ) -> List[dict]:
        """
        Merge keyword and semantic search results.
        Deduplicate by product ID and combine scores.

        Args:
            keyword_results: Results from keyword search
            semantic_results: Results from semantic search

        Returns:
            Merged and deduplicated results with combined scores
        """
        if not keyword_results and not semantic_results:
            return []

        # Build a map of product_id -> product_data
        merged_map = {}

        # Add keyword results
        for product in keyword_results:
            product_id = product.get("id")
            if product_id:
                merged_map[product_id] = {
                    **product,
                    "keyword_score": product.get("keyword_score", 0.0),
                    "semantic_score": 0.0,
                    "combined_score": product.get("keyword_score", 0.0)
                }

        # Merge semantic results
        for product in semantic_results:
            product_id = product.get("id")
            if product_id:
                if product_id in merged_map:
                    # Product exists in both - combine scores (equal weighting)
                    keyword_score = merged_map[product_id].get("keyword_score", 0.0)
                    semantic_score = product.get("semantic_score", 0.0)
                    combined = (keyword_score + semantic_score) / 2.0
                    merged_map[product_id]["semantic_score"] = semantic_score
                    merged_map[product_id]["combined_score"] = combined
                else:
                    # Product only in semantic results
                    merged_map[product_id] = {
                        **product,
                        "keyword_score": 0.0,
                        "semantic_score": product.get("semantic_score", 0.0),
                        "combined_score": product.get("semantic_score", 0.0)
                    }

        # Convert to list and sort by combined score
        results = list(merged_map.values())
        results.sort(key=lambda x: x.get("combined_score", 0.0), reverse=True)

        return results

    def apply_filters(
        self,
        products: List[dict],
        filters: ProductSearchFilters
    ) -> List[dict]:
        """
        Apply extracted filters to search results.

        Args:
            products: Search results
            filters: ProductSearchFilters with extraction filters

        Returns:
            Filtered products
        """
        if not products:
            return []

        filtered = []

        for product in products:
            # Apply availability filter
            quantity = product.get("quantity", 0)
            reorder_level = product.get("reorder_level", 0)

            if filters.availability == AvailabilityFilter.AVAILABLE:
                if quantity > 0:
                    filtered.append(product)
            elif filters.availability == AvailabilityFilter.LOW_STOCK:
                if quantity < reorder_level and quantity > 0:
                    filtered.append(product)
            elif filters.availability == AvailabilityFilter.OUT_OF_STOCK:
                if quantity == 0:
                    filtered.append(product)
            else:  # ANY
                filtered.append(product)

            # Apply is_active filter
            if filtered and filters.is_active:
                product_to_check = filtered[-1] if filtered else None
                if product_to_check and not product_to_check.get("is_active", True):
                    filtered.pop()

        return filtered

    def hybrid_search(
        self,
        query: str,
        products: List[dict],
        semantic_threshold: float = 0.5
    ) -> dict:
        """
        Perform hybrid search combining keyword and semantic search.

        Algorithm Flow:
        1. Extract filters from query
        2. Run keyword search on products
        3. Run semantic search on products
        4. Merge and deduplicate results
        5. Apply extracted filters

        Args:
            query: User search query
            products: List of product dicts with 'id', 'name', 'sku', 'quantity', 'reorder_level'
            semantic_threshold: Minimum similarity score for semantic search

        Returns:
            Dict with:
                - results: Final filtered results with scores
                - filters_extracted: Extracted filters from query
                - metadata: Search metadata (counts, etc.)
        """
        # Step 1: Extract filters from query
        filters = self.extract_filters_from_query(query)

        # Remove filter keywords from query for search
        clean_query = self._clean_query_for_search(query)

        # Step 2: Keyword search
        keyword_results = self.keyword_search(clean_query, products)

        # Step 3: Semantic search
        semantic_results = self.semantic_search(
            clean_query,
            products,
            threshold=semantic_threshold
        )

        # Step 4: Merge and deduplicate
        merged_results = self.merge_and_deduplicate(keyword_results, semantic_results)

        # Step 5: Apply filters
        final_results = self.apply_filters(merged_results, filters)

        return {
            "results": final_results,
            "filters_extracted": filters.model_dump(),
            "metadata": {
                "total_results": len(final_results),
                "keyword_matches": len(keyword_results),
                "semantic_matches": len(semantic_results),
                "merged_count": len(merged_results),
                "query": query,
                "clean_query": clean_query
            }
        }

    def semantic_search(
        self,
        query: str,
        products: List[dict],
        threshold: float = 0.5
    ) -> List[dict]:
        """Wrapper for semantic search engine"""
        if not self.semantic_engine or not self.semantic_engine.model_loaded:
            return []
        return self.semantic_engine.semantic_search(query, products, threshold)

    def _clean_query_for_search(self, query: str) -> str:
        """
        Remove filter keywords from query for cleaner keyword/semantic search.

        Examples:
            "nike shoes available" -> "nike shoes"
            "all adidas low stock" -> "all adidas"
        """
        filter_keywords = [
            "available", "in stock", "in-stock",
            "low stock", "low-stock", "reorder",
            "out of stock", "out-of-stock", "unavailable",
            "all", "show", "get"
        ]

        clean = query.lower()
        for keyword in filter_keywords:
            clean = re.sub(r'\b' + re.escape(keyword) + r'\b', '', clean, flags=re.IGNORECASE)

        # Remove extra spaces
        clean = ' '.join(clean.split())
        return clean
