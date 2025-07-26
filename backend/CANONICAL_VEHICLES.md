# Canonical Vehicle System

The Canonical Vehicle System is a powerful feature of MercadoSniper that groups similar vehicle listings together under a single "canonical" vehicle entity. This allows you to:

- View all listings for the same vehicle model/configuration in one place
- Get better market insights and price analysis for specific vehicle types
- Track price trends across multiple listings of the same vehicle
- Set alerts for canonical vehicles that trigger on any matching listing

## How It Works

### Core Concept

A **Canonical Vehicle** represents a unique vehicle configuration (brand, model, year, edition, etc.) that can have multiple **Vehicle Listings** associated with it. Each listing is a specific instance of that vehicle being sold on MercadoLibre.

```
Canonical Vehicle: "Honda Civic 2020 LX"
├── Listing 1: Honda Civic 2020 LX Automático - $85,000,000 (Bogotá)
├── Listing 2: Honda Civic LX 2020 Turbo Automático - $87,000,000 (Medellín)
└── Listing 3: HONDA CIVIC LX 2020 1.5 TURBO - $84,500,000 (Cali)
```

### Similarity Algorithm

The system uses a sophisticated similarity algorithm that considers:

1. **Brand matching** (30% weight) - Case-insensitive brand comparison
2. **Model matching** (30% weight) - Case-insensitive model comparison  
3. **Year matching** (20% weight) - Exact year match or close years (±1 year)
4. **Edition matching** (10% weight) - Trim level or edition comparison
5. **Engine matching** (10% weight) - Engine specifications comparison

Vehicles are grouped together if they have a similarity score of 85% or higher.

### Automatic Grouping

When a new vehicle is scraped or added to the system:

1. The system searches for existing canonical vehicles that might match
2. It calculates similarity scores against potential matches
3. If a match is found (≥85% similarity), the vehicle is linked to that canonical vehicle
4. If no match is found, a new canonical vehicle is created
5. Market statistics are automatically updated for the canonical vehicle

## Database Schema

### Canonical Vehicle Model

```python
class CanonicalVehicle(BaseModel):
    id: Optional[str]
    brand: str
    model: str
    year: Optional[str]
    edition: Optional[str]
    engine: Optional[str]
    transmission: Optional[str]
    fuel_type: Optional[str]
    doors: Optional[int]
    body_type: Optional[str]
    canonical_title: Optional[str]
    canonical_image_url: Optional[str]
    specifications: Dict[str, Any]
    
    # Market data (auto-calculated)
    min_price: Optional[float]
    max_price: Optional[float]
    avg_price: Optional[float]
    median_price: Optional[float]
    price_trend: Optional[str]  # "up", "down", "stable"
    
    # Statistics (auto-calculated)
    total_listings: int
    active_listings: int
    total_views: int
    average_kilometers: Optional[float]
    
    # Metadata
    status: CanonicalVehicleStatus
    created_at: datetime
    updated_at: datetime
    last_market_update: Optional[datetime]
```

### Vehicle Listing Model

The existing `Vehicle` model now includes:

```python
canonical_vehicle_id: Optional[str]  # Reference to canonical vehicle
```

## API Endpoints

### Get Canonical Vehicles
```
GET /api/canonical-vehicles/
```
Returns paginated list of canonical vehicles with market data.

Query parameters:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)
- `brand`: Filter by brand
- `model`: Filter by model
- `year`: Filter by year

### Get Canonical Vehicle Details
```
GET /api/canonical-vehicles/{canonical_id}
```
Returns detailed information about a specific canonical vehicle.

### Get Listings for Canonical Vehicle
```
GET /api/canonical-vehicles/{canonical_id}/listings
```
Returns all individual listings associated with a canonical vehicle.

### Get Market Analysis
```
GET /api/canonical-vehicles/{canonical_id}/market-analysis
```
Returns comprehensive market analysis including:
- Price statistics (min, max, avg, median)
- Location distribution
- Year distribution
- Average views per listing

### Create Canonical Vehicle
```
POST /api/canonical-vehicles/
```
Manually create a new canonical vehicle.

### Update Canonical Vehicle
```
PUT /api/canonical-vehicles/{canonical_id}
```
Update canonical vehicle information.

### Update Statistics
```
POST /api/canonical-vehicles/{canonical_id}/update-stats
```
Manually trigger statistics update for a canonical vehicle.

### Merge Canonical Vehicles
```
POST /api/canonical-vehicles/{source_id}/merge/{target_id}
```
Merge two canonical vehicles (move all listings from source to target).

## Migration to Canonical Vehicles

### For Existing Data

If you already have vehicle data in your database, use the migration script:

```bash
# Run a dry-run first to see what would happen
python backend/scripts/migrate_to_canonical_vehicles.py --dry-run --limit 20

# Run the actual migration
python backend/scripts/migrate_to_canonical_vehicles.py --batch-size 100
```

The migration script will:
1. Find all vehicles without canonical vehicle assignments
2. Use the similarity algorithm to group them
3. Create canonical vehicles as needed
4. Link existing vehicles to canonical vehicles
5. Update statistics for all canonical vehicles

### Migration Options

- `--dry-run`: Test the migration without making changes
- `--limit N`: Limit dry-run to N vehicles (default: 10)
- `--batch-size N`: Process N vehicles at a time (default: 100)

## Testing the System

Test the similarity algorithm and grouping logic:

```bash
python backend/scripts/test_canonical_grouping.py
```

This test script will:
1. Create test vehicle data
2. Test similarity calculations
3. Verify grouping logic
4. Test edge cases and error handling

## Database Indexes

The system automatically creates optimized indexes:

### Canonical Vehicles Collection
- `(brand, model)` - Basic grouping queries
- `(brand, model, year)` - Year-specific queries
- `(brand, model, edition)` - Edition-specific queries
- `(status)` - Status filtering
- `(total_listings, -1)` - Sorting by popularity
- `(active_listings, -1)` - Sorting by active listings
- Text index on `(canonical_title, brand, model)` - Search functionality

### Vehicles Collection
- `(canonical_vehicle_id)` - Linking to canonical vehicles
- `(brand, model)` - Similarity searches
- `(status)` - Status filtering
- `(price_numeric)` - Price-based queries

## Performance Considerations

### Similarity Search Optimization

1. **Exact Matches First**: The system prioritizes exact matches before fuzzy matching
2. **Index Usage**: Strategic use of compound indexes for efficient candidate selection
3. **Batch Processing**: Migration processes vehicles in configurable batches
4. **Caching**: Future enhancement could include caching of similarity calculations

### Statistics Updates

1. **Automatic Updates**: Statistics are updated when vehicles are added/updated
2. **Lazy Calculation**: Heavy statistics are calculated only when needed
3. **Background Processing**: Consider moving to background tasks for large datasets

## Example Usage

### 1. Getting Popular Vehicle Models

```python
# Get canonical vehicles sorted by number of listings
response = await canonical_service.get_canonical_vehicles_with_listings(
    page=1,
    page_size=20,
    filters=None
)

for canonical in response["canonical_vehicles"]:
    print(f"{canonical.canonical_title}: {canonical.active_listings} listings")
```

### 2. Market Analysis for Specific Vehicle

```python
# Get market analysis for Honda Civic 2020
canonical_id = "some_canonical_id"
analysis = await canonical_service.get_canonical_vehicle_market_analysis(canonical_id)

print(f"Price range: ${analysis['market_analysis']['price_analysis']['min_price']:,.0f} - ${analysis['market_analysis']['price_analysis']['max_price']:,.0f}")
print(f"Average price: ${analysis['market_analysis']['price_analysis']['avg_price']:,.0f}")
print(f"Total listings: {analysis['market_analysis']['total_listings']}")
```

### 3. Setting Alerts on Canonical Vehicles

```python
# Set alert for any Honda Civic 2020 LX under $80M
alert = AlertCreate(
    canonical_vehicle_id=canonical_id,
    target_price=80000000,
    condition="below",
    notification_method="email"
)
```

## Troubleshooting

### Common Issues

1. **Vehicles Not Grouping**: Check similarity thresholds in `CanonicalVehicleService`
2. **Performance Issues**: Verify database indexes are created
3. **Duplicate Canonicals**: Use the merge endpoint to combine similar canonicals

### Debug Mode

Enable debug logging to see similarity calculations:

```python
import logging
logging.getLogger("services.canonical_vehicle_service").setLevel(logging.DEBUG)
```

### Manual Canonical Creation

If automatic grouping isn't working for specific cases, you can manually create canonical vehicles and assign vehicles to them.

## Future Enhancements

1. **Machine Learning**: Use ML models for better similarity detection
2. **Image Recognition**: Compare vehicle images for better matching
3. **User Feedback**: Allow users to suggest merges or splits
4. **Specification Standardization**: Normalize engine specs, transmissions, etc.
5. **Market Trends**: Predict price trends based on historical data
6. **Geographic Analysis**: Regional price variations and trends

## Contributing

When adding new features to the canonical vehicle system:

1. Update the similarity algorithm weights if needed
2. Add new tests to `test_canonical_grouping.py`
3. Update database indexes if new query patterns are introduced
4. Update this documentation

## Support

For issues related to the canonical vehicle system:

1. Check the logs for similarity calculation details
2. Run the test script to verify system health
3. Use the dry-run migration to test grouping logic
4. Check database indexes and query performance 