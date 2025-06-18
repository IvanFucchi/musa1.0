// Test del cache service
import MuseumCacheService from './utils/MuseumCacheService.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testCacheService() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected');
    
    const cacheService = new MuseumCacheService();
    
    // Test cache miss
    const miss = await cacheService.getCachedResults(['test'], 'test query');
    console.log('✅ Cache miss test:', miss === null ? 'PASS' : 'FAIL');
    
    // Test cache save
    await cacheService.cacheResults(
      ['test'],
      'test query',
      [{ title: 'Test Art' }],
      { totalResults: 1 }
    );
    console.log('✅ Cache save completed');
    
    // Test cache hit
    const hit = await cacheService.getCachedResults(['test'], 'test query');
    console.log('✅ Cache hit test:', hit ? 'PASS' : 'FAIL');
    
    // Test stats
    const stats = await cacheService.getStats();
    console.log('✅ Cache stats:', stats.runtime);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testCacheService();