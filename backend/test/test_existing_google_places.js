// Test script per Google Places Service esistente
import GooglePlacesService from '../utils/googlePlacesService.js';
import 'dotenv/config';

const testExistingGooglePlaces = async () => {
  console.log('🧪 Testing existing Google Places Service...');
  
  const placesService = new GooglePlacesService();
  
  try {
    // Test 1: Health check
    console.log('\n📍 Test 1: Health check');
    const health = await placesService.healthCheck();
    console.log('🏥 Health status:', health);
    
    if (health.status !== 'healthy') {
      console.log('❌ Google Places not healthy, skipping tests');
      console.log('💡 Make sure GOOGLE_PLACES_API_KEY is set in .env');
      return;
    }
    
    // Test 2: Cerca Colosseo
    console.log('\n📍 Test 2: Searching for "Colosseo" in Rome');
    const colosseoPlaces = await placesService.searchPlaces('Colosseo', 'Roma', 'tourist_attraction');
    console.log(`✅ Found ${colosseoPlaces.length} places for Colosseo`);
    
    if (colosseoPlaces.length > 0) {
      const place = colosseoPlaces[0];
      console.log('📋 First place:');
      console.log(`   Name: ${place.name}`);
      console.log(`   Address: ${place.address}`);
      console.log(`   Photos: ${place.photos.length}`);
      if (place.photos.length > 0) {
        console.log(`   First photo: ${place.photos[0]}`);
      }
    }
    
    // Test 3: Converti in formato museo
    if (colosseoPlaces.length > 0) {
      console.log('\n📍 Test 3: Converting to museum format');
      const museumFormat = placesService.convertToMuseumFormat(colosseoPlaces);
      console.log(`✅ Converted to ${museumFormat.length} museum-format results`);
      
      if (museumFormat.length > 0) {
        console.log('📋 First museum result:');
        console.log(`   Title: ${museumFormat[0].title}`);
        console.log(`   Source: ${museumFormat[0].source}`);
        console.log(`   Repository: ${museumFormat[0].repository}`);
        console.log(`   Has Image: ${!!museumFormat[0].primaryImage}`);
      }
    }
    
    // Test 4: Cerca Pantheon
    console.log('\n📍 Test 4: Searching for "Pantheon" in Rome');
    const pantheonPlaces = await placesService.searchPlaces('Pantheon', 'Roma');
    console.log(`✅ Found ${pantheonPlaces.length} places for Pantheon`);
    
    // Test 5: Cache test
    console.log('\n📍 Test 5: Cache test (searching Colosseo again)');
    const cachedResults = await placesService.searchPlaces('Colosseo', 'Roma', 'tourist_attraction');
    console.log(`✅ Cache test: ${cachedResults.length} results (should be cached)`);
    
  } catch (error) {
    console.error('❌ Google Places test failed:', error.message);
  }
};

// Esegui test se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testExistingGooglePlaces();
}

export default testExistingGooglePlaces;

