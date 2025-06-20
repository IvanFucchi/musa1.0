// Test script per Google Custom Search
import 'dotenv/config';
import GoogleCustomSearchService from '../utils/googleCustomSearchService.js';

const testGoogleCSE = async () => {
  console.log('🧪 Testing Google Custom Search...');
  
  const googleService = new GoogleCustomSearchService();
  
  try {
    // Test 1: Health check
    console.log('\n📍 Test 1: Health check');
    const health = await googleService.healthCheck();
    console.log('🏥 Health status:', health);
    
    if (health.status !== 'healthy') {
      console.log('❌ Google CSE not healthy, skipping artwork tests');
      return;
    }
    
    // Test 2: Cerca opera famosa
    console.log('\n📍 Test 2: Searching for "Mona Lisa" by Leonardo da Vinci');
    const monaLisaResults = await googleService.searchSpecificArtwork('Mona Lisa', 'Leonardo da Vinci');
    console.log(`✅ Found ${monaLisaResults.length} results for Mona Lisa`);
    
    if (monaLisaResults.length > 0) {
      console.log('📋 First result:');
      console.log(`   Title: ${monaLisaResults[0].title}`);
      console.log(`   Artist: ${monaLisaResults[0].artist}`);
      console.log(`   Image URL: ${monaLisaResults[0].primaryImage}`);
      console.log(`   Source: ${monaLisaResults[0].source}`);
    }
    
    // Test 3: Cerca opera di Caravaggio
    console.log('\n📍 Test 3: Searching for "Vocazione di San Matteo" by Caravaggio');
    const caravaggioResults = await googleService.searchSpecificArtwork('Vocazione di San Matteo', 'Caravaggio');
    console.log(`✅ Found ${caravaggioResults.length} results for Vocazione di San Matteo`);
    
    if (caravaggioResults.length > 0) {
      console.log('📋 First result:');
      console.log(`   Title: ${caravaggioResults[0].title}`);
      console.log(`   Artist: ${caravaggioResults[0].artist}`);
      console.log(`   Image URL: ${caravaggioResults[0].primaryImage}`);
    }
    
    // Test 4: Cerca luogo
    console.log('\n📍 Test 4: Searching for place "Colosseum" in Rome');
    const placeResults = await googleService.searchPlace('Colosseum', 'Rome');
    console.log(`✅ Found ${placeResults.length} results for Colosseum`);
    
    if (placeResults.length > 0) {
      console.log('📋 First result:');
      console.log(`   Title: ${placeResults[0].title}`);
      console.log(`   Image URL: ${placeResults[0].primaryImage}`);
    }
    
  } catch (error) {
    console.error('❌ Google CSE test failed:', error.message);
  }
};

// Esegui test se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testGoogleCSE();
}

export default testGoogleCSE;

