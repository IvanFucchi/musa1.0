// Test script per WikiArt Service migliorato
import WikiArtService from '../utils/wikiArtService.js';

const testWikiArt = async () => {
  console.log('🧪 Testing WikiArt Service...');
  
  const wikiService = new WikiArtService();
  
  try {
    // Test 1: Connection test
    console.log('\n📍 Test 1: Connection test');
    const connected = await wikiService.testConnection();
    console.log(`🔗 Connection: ${connected ? 'OK' : 'FAILED'}`);
    
    if (!connected) {
      console.log('❌ WikiArt connection failed, skipping artwork tests');
      return;
    }
    
    // Test 2: Cerca opera famosa di Caravaggio
    console.log('\n📍 Test 2: Searching for "Vocazione di San Matteo" by Caravaggio');
    const vocazioneResults = await wikiService.searchSpecificArtwork('Vocazione di San Matteo', 'Caravaggio');
    console.log(`✅ Found ${vocazioneResults.length} results for Vocazione di San Matteo`);
    
    if (vocazioneResults.length > 0) {
      console.log('📋 First result:');
      console.log(`   Title: ${vocazioneResults[0].title}`);
      console.log(`   Artist: ${vocazioneResults[0].artist}`);
      console.log(`   Repository: ${vocazioneResults[0].repository}`);
      console.log(`   Image URL: ${vocazioneResults[0].primaryImage}`);
      console.log(`   Match Score: ${vocazioneResults[0].matchScore}`);
    }
    
    // Test 3: Cerca altra opera di Caravaggio
    console.log('\n📍 Test 3: Searching for "Conversione di San Paolo" by Caravaggio');
    const conversioneResults = await wikiService.searchSpecificArtwork('Conversione di San Paolo', 'Caravaggio');
    console.log(`✅ Found ${conversioneResults.length} results for Conversione di San Paolo`);
    
    if (conversioneResults.length > 0) {
      console.log('📋 First result:');
      console.log(`   Title: ${conversioneResults[0].title}`);
      console.log(`   Artist: ${conversioneResults[0].artist}`);
      console.log(`   Match Score: ${conversioneResults[0].matchScore}`);
    }
    
    // Test 4: Cerca opera molto famosa (controllo)
    console.log('\n📍 Test 4: Searching for "Mona Lisa" by Leonardo da Vinci');
    const monaLisaResults = await wikiService.searchSpecificArtwork('Mona Lisa', 'Leonardo da Vinci');
    console.log(`✅ Found ${monaLisaResults.length} results for Mona Lisa`);
    
    if (monaLisaResults.length > 0) {
      console.log('📋 First result:');
      console.log(`   Title: ${monaLisaResults[0].title}`);
      console.log(`   Artist: ${monaLisaResults[0].artist}`);
      console.log(`   Match Score: ${monaLisaResults[0].matchScore}`);
    }
    
    // Test 5: Cache test
    console.log('\n📍 Test 5: Cache test (searching Mona Lisa again)');
    const cachedResults = await wikiService.searchSpecificArtwork('Mona Lisa', 'Leonardo da Vinci');
    console.log(`✅ Cache test: ${cachedResults.length} results (should be cached)`);
    
  } catch (error) {
    console.error('❌ WikiArt test failed:', error.message);
  }
};

// Esegui test se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testWikiArt();
}

export default testWikiArt;

