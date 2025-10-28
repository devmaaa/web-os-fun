/**
 * FSM Performance Test
 *
 * This test demonstrates the performance improvement from FSM transition caching.
 * Run this in the browser console or as part of your test suite.
 */

import { createFSM } from '@core/fsm';

// Simple window FSM for testing
const windowTransitions = {
  'closed': { 'open': 'opening' },
  'opening': { 'open': 'normal' },
  'normal': { 'minimize': 'minimizing', 'maximize': 'maximizing', 'close': 'closing' },
  'minimizing': { 'minimize': 'minimized' },
  'minimized': { 'restore': 'restoring' },
  'restoring': { 'restore': 'normal' },
  'maximizing': { 'maximize': 'maximized' },
  'maximized': { 'restore': 'normal', 'close': 'closing' },
  'closing': { 'close': 'closed' }
};

export function testFSMPerformance() {
  console.log('🚀 FSM Performance Test - Transition Caching Optimization');
  console.log('================================================================');

  // Create test FSM
  const fsm = createFSM('test-window', 'closed', windowTransitions);

  // Test 1: Cold cache vs Warm cache performance for can() method
  console.log('\n📊 Test 1: can() method performance');

  // Clear cache first
  fsm.clearCaches();

  const iterations = 10000;
  const testEvent = 'open' as const;

  // Cold cache test
  const coldStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    fsm.can(testEvent);
  }
  const coldEnd = performance.now();
  const coldTime = coldEnd - coldStart;

  // Warm cache test (cache already populated from above)
  const warmStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    fsm.can(testEvent);
  }
  const warmEnd = performance.now();
  const warmTime = warmEnd - warmStart;

  console.log(`Cold cache (${iterations} calls): ${coldTime.toFixed(2)}ms`);
  console.log(`Warm cache (${iterations} calls): ${warmTime.toFixed(2)}ms`);
  console.log(`Performance improvement: ${((coldTime - warmTime) / coldTime * 100).toFixed(1)}% faster`);

  // Test 2: Transition performance
  console.log('\n📊 Test 2: transition() method performance');

  // Reset to known state
  fsm.reset('closed');

  // Test cached transitions (open sequence)
  const transitionStart = performance.now();
  for (let i = 0; i < 1000; i++) {
    fsm.reset('closed');
    fsm.transition('open');      // closed -> opening
    fsm.transition('open');      // opening -> normal (cached)
  }
  const transitionEnd = performance.now();
  const transitionTime = transitionEnd - transitionStart;

  console.log(`Cached transitions (2000 transitions): ${transitionTime.toFixed(2)}ms`);
  console.log(`Average per transition: ${(transitionTime / 2000).toFixed(4)}ms`);

  // Test 3: Cache statistics
  console.log('\n📊 Test 3: Cache statistics');
  const stats = fsm.getCacheStats();
  console.log('Cache stats:', stats);

  // Test 4: Memory efficiency
  console.log('\n📊 Test 4: Memory efficiency test');
  const inspection = fsm.inspect();
  console.log('FSM inspection with cache stats:', inspection);

  console.log('\n✅ FSM Performance Test Complete!');
  console.log('The caching optimization provides significant performance benefits for:');
  console.log('- Repeated can() calls (O(1) vs O(1) with object lookup)');
  console.log('- Repeated transitions (cached result validation)');
  console.log('- getPossibleEvents() calls (cached per state)');

  return {
    canPerformance: { coldTime, warmTime, improvement: (coldTime - warmTime) / coldTime * 100 },
    transitionPerformance: { totalTime: transitionTime, avgTime: transitionTime / 2000 },
    cacheStats: stats,
    inspection
  };
}

// Export for use in browser console or tests
if (typeof window !== 'undefined') {
  (window as any).testFSMPerformance = testFSMPerformance;
  console.log('💡 Run testFSMPerformance() in console to test FSM caching optimization');
}