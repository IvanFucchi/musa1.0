import mongoose from 'mongoose';
import MuseumCache from './models/MuseumCache.js';
import dotenv from 'dotenv';

dotenv.config();

async function testCacheModel() {
  try {
    // Connetti al database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected');
    
    // Test creazione cache entry
    const testEntry = await MuseumCache.createCacheEntry(
      ['test', 'picasso'],
      'test picasso',
      [{ title: 'Test Artwork', artist: 'Test Artist' }],
      { totalResults: 1, processingTimeMs: 100 }
    );
    
    console.log('✅ Cache entry created:', testEntry._id);
    
    // Test ricerca
    const found = await MuseumCache.findBySearchTerms(['test', 'picasso']);
    console.log('✅ Cache entry found:', found ? 'YES' : 'NO');
    
    // Cleanup test
    await MuseumCache.deleteOne({ _id: testEntry._id });
    console.log('✅ Test cleanup completed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testCacheModel();