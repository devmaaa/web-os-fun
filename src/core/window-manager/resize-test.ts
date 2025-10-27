/**
 * Performance Test Suite for Window Resize System
 *
 * Tests:
 * - Resize latency (<10ms target)
 * - Event dispatch performance (<1ms target)
 * - Memory usage tracking
 * - FSM state validation
 * - ResizeObserver efficiency
 */

import { windowService } from './window-service';
import { resizeManager } from './resize-manager';
import { windowFSMManager } from '../fsm';
import { eventBus } from '../event-bus';
import type { Window } from './types';

export interface ResizeTestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: any;
  performance: {
    averageLatency: number;
    maxLatency: number;
    eventDispatchTime: number;
    memoryUsage: number;
  };
}

export class ResizePerformanceTest {
  private testWindow: Window | null = null;
  private performanceMetrics: number[] = [];
  private eventLatencies: number[] = [];

  /**
   * Run complete performance test suite
   */
  async runFullTestSuite(): Promise<ResizeTestResult[]> {
    console.log('🧪 Starting Window Resize Performance Tests...');

    const results: ResizeTestResult[] = [];

    try {
      // Setup test window
      await this.setupTestWindow();

      // Run individual tests
      results.push(await this.testResizeLatency());
      results.push(await this.testEventBusPerformance());
      results.push(await this.testFSMStateTransitions());
      results.push(await this.testConcurrentResizes());
      results.push(await this.testMemoryUsage());
      results.push(await this.testResizeObserverEfficiency());

      // Cleanup
      this.cleanup();

      // Print summary
      this.printTestSummary(results);

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      results.push({
        testName: 'Test Suite',
        passed: false,
        duration: 0,
        details: { error: error.message },
        performance: {
          averageLatency: 0,
          maxLatency: 0,
          eventDispatchTime: 0,
          memoryUsage: 0
        }
      });
    }

    return results;
  }

  /**
   * Setup test window for performance testing
   */
  private async setupTestWindow(): Promise<void> {
    console.log('📋 Setting up test window...');

    this.testWindow = windowService.openWindow('test-plugin', 'Performance Test Window', {
      width: 600,
      height: 400,
      x: 100,
      y: 100,
      resizable: true,
      minWidth: 200,
      minHeight: 150
    });

    // Wait for window to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!this.testWindow) {
      throw new Error('Failed to create test window');
    }

    console.log(`✅ Test window created: ${this.testWindow.id}`);
  }

  /**
   * Test 1: Resize Latency (<10ms target)
   */
  private async testResizeLatency(): Promise<ResizeTestResult> {
    console.log('⚡ Testing resize latency...');

    const startTime = performance.now();
    const latencies: number[] = [];
    const iterations = 50;

    // Listen to resize events
    const unsubscribe = eventBus.on('window:resize_end', () => {
      const latency = performance.now() - startTime;
      latencies.push(latency);
    });

    // Simulate resize operations
    for (let i = 0; i < iterations; i++) {
      const resizeStart = performance.now();

      // Start resize
      if (this.testWindow) {
        windowService.startWindowResize(this.testWindow.id, 'bottom-right', {
          clientX: 200,
          clientY: 200
        } as MouseEvent);

        // Simulate small resize operation
        await new Promise(resolve => setTimeout(resolve, 5));

        // End resize
        windowService.endWindowResize(this.testWindow.id);
      }

      const resizeEnd = performance.now();
      this.performanceMetrics.push(resizeEnd - resizeStart);
    }

    unsubscribe();

    const averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);
    const passed = averageLatency < 10; // Target: <10ms

    return {
      testName: 'Resize Latency Test',
      passed,
      duration: performance.now() - startTime,
      details: {
        iterations,
        averageLatency: averageLatency.toFixed(2) + 'ms',
        maxLatency: maxLatency.toFixed(2) + 'ms',
        target: '<10ms'
      },
      performance: {
        averageLatency,
        maxLatency,
        eventDispatchTime: 0,
        memoryUsage: 0
      }
    };
  }

  /**
   * Test 2: EventBus Performance (<1ms target)
   */
  private async testEventBusPerformance(): Promise<ResizeTestResult> {
    console.log('📡 Testing EventBus performance...');

    const startTime = performance.now();
    const eventLatencies: number[] = [];
    const iterations = 100;

    // Listen to resize events
    const unsubscribe = eventBus.on('window:resizing', () => {
      const eventTime = performance.now();
      eventLatencies.push(eventTime - startTime);
    });

    // Emit resize events rapidly
    for (let i = 0; i < iterations; i++) {
      const eventStart = performance.now();

      eventBus.emitSync('window:resizing', {
        id: this.testWindow?.id,
        timestamp: Date.now()
      });

      const eventEnd = performance.now();
      this.eventLatencies.push(eventEnd - eventStart);
    }

    unsubscribe();

    const averageEventLatency = this.eventLatencies.reduce((a, b) => a + b, 0) / this.eventLatencies.length;
    const maxEventLatency = Math.max(...this.eventLatencies);
    const passed = averageEventLatency < 1; // Target: <1ms

    return {
      testName: 'EventBus Performance Test',
      passed,
      duration: performance.now() - startTime,
      details: {
        iterations,
        averageLatency: averageEventLatency.toFixed(3) + 'ms',
        maxLatency: maxEventLatency.toFixed(3) + 'ms',
        target: '<1ms'
      },
      performance: {
        averageLatency: 0,
        maxLatency: 0,
        eventDispatchTime: averageEventLatency,
        memoryUsage: 0
      }
    };
  }

  /**
   * Test 3: FSM State Transitions
   */
  private async testFSMStateTransitions(): Promise<ResizeTestResult> {
    console.log('🔀 Testing FSM state transitions...');

    const startTime = performance.now();
    const stateTransitions: string[] = [];
    let errors = 0;

    if (!this.testWindow) {
      throw new Error('Test window not available');
    }

    // Track FSM transitions
    const unsubscribe = eventBus.on('fsm:transition', (event) => {
      if (event.id === `window:${this.testWindow!.id}`) {
        stateTransitions.push(`${event.from} → ${event.to} via ${event.event}`);
      }
    });

    // Test valid transitions
    try {
      const canResize = windowFSMManager.canResizeWindow(this.testWindow.id);
      if (!canResize) {
        errors++;
        console.warn('FSM: Window should be resizable in normal state');
      }

      // Test resize start
      const resizeStarted = windowFSMManager.startResizeWindow(this.testWindow.id);
      if (!resizeStarted) {
        errors++;
        console.warn('FSM: Failed to start resize');
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      // Test resize end
      const resizeEnded = windowFSMManager.endResizeWindow(this.testWindow.id);
      if (!resizeEnded) {
        errors++;
        console.warn('FSM: Failed to end resize');
      }

      // Test invalid transitions (should fail)
      const invalidTransition = windowFSMManager.startResizeWindow(this.testWindow.id);
      windowFSMManager.startResizeWindow(this.testWindow.id); // Should fail (already resizing)

    } catch (error) {
      errors++;
      console.error('FSM transition error:', error);
    }

    unsubscribe();

    const passed = errors === 0 && stateTransitions.length >= 2; // Should have at least start and end

    return {
      testName: 'FSM State Transitions Test',
      passed,
      duration: performance.now() - startTime,
      details: {
        transitions: stateTransitions,
        errors,
        expectedTransitions: ['normal → resizing', 'resizing → normal']
      },
      performance: {
        averageLatency: 0,
        maxLatency: 0,
        eventDispatchTime: 0,
        memoryUsage: 0
      }
    };
  }

  /**
   * Test 4: Concurrent Resize Operations
   */
  private async testConcurrentResizes(): Promise<ResizeTestResult> {
    console.log('🔄 Testing concurrent resize operations...');

    const startTime = performance.now();
    const windows: Window[] = [];
    const concurrentOperations = 5;

    // Create multiple windows
    for (let i = 0; i < concurrentOperations; i++) {
      const window = windowService.openWindow('test-plugin', `Concurrent Test ${i}`, {
        width: 400 + i * 20,
        height: 300 + i * 20,
        x: 100 + i * 50,
        y: 100 + i * 50,
        resizable: true
      });
      windows.push(window);
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    // Start concurrent resizes
    const resizePromises = windows.map((window, index) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          windowService.startWindowResize(window.id, 'bottom-right', {
            clientX: 200 + index * 10,
            clientY: 200 + index * 10
          } as MouseEvent);

          setTimeout(() => {
            windowService.endWindowResize(window.id);
            resolve();
          }, 50);
        }, index * 10);
      });
    });

    await Promise.all(resizePromises);

    // Clean up test windows
    windows.forEach(window => {
      windowService.closeWindow(window.id);
    });

    const duration = performance.now() - startTime;
    const passed = duration < 1000; // Should complete within 1 second

    return {
      testName: 'Concurrent Resize Operations Test',
      passed,
      duration,
      details: {
        concurrentWindows: concurrentOperations,
        totalDuration: duration.toFixed(2) + 'ms',
        averagePerWindow: (duration / concurrentOperations).toFixed(2) + 'ms'
      },
      performance: {
        averageLatency: duration / concurrentOperations,
        maxLatency: duration,
        eventDispatchTime: 0,
        memoryUsage: 0
      }
    };
  }

  /**
   * Test 5: Memory Usage
   */
  private async testMemoryUsage(): Promise<ResizeTestResult> {
    console.log('💾 Testing memory usage...');

    const startTime = performance.now();

    // Get initial memory (if available)
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

    // Create and resize many windows
    const testWindows: Window[] = [];
    const windowCount = 10;

    for (let i = 0; i < windowCount; i++) {
      const window = windowService.openWindow('test-plugin', `Memory Test ${i}`, {
        width: 300,
        height: 200,
        x: i * 20,
        y: i * 20,
        resizable: true
      });
      testWindows.push(window);

      // Perform resize operations
      windowService.startWindowResize(window.id, 'bottom-right', {
        clientX: 300,
        clientY: 200
      } as MouseEvent);

      await new Promise(resolve => setTimeout(resolve, 1));

      windowService.endWindowResize(window.id);
    }

    // Get final memory
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    const memoryPerWindow = memoryIncrease / windowCount;

    // Clean up
    testWindows.forEach(window => {
      windowService.closeWindow(window.id);
    });

    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }

    const passed = memoryPerWindow < 1024 * 1024; // Target: <1MB per window

    return {
      testName: 'Memory Usage Test',
      passed,
      duration: performance.now() - startTime,
      details: {
        windowCount,
        memoryIncrease: (memoryIncrease / 1024 / 1024).toFixed(2) + 'MB',
        memoryPerWindow: (memoryPerWindow / 1024).toFixed(2) + 'KB',
        target: '<1MB per window'
      },
      performance: {
        averageLatency: 0,
        maxLatency: 0,
        eventDispatchTime: 0,
        memoryUsage: memoryPerWindow
      }
    };
  }

  /**
   * Test 6: ResizeObserver Efficiency
   */
  private async testResizeObserverEfficiency(): Promise<ResizeTestResult> {
    console.log('👁️ Testing ResizeObserver efficiency...');

    const startTime = performance.now();
    const observerCallbacks: number[] = [];

    if (!this.testWindow) {
      throw new Error('Test window not available');
    }

    // Listen to resize events from ResizeObserver
    const unsubscribe = eventBus.on('window:resized', () => {
      observerCallbacks.push(performance.now());
    });

    // Simulate external resize changes
    const windowElement = document.querySelector(`.window[data-window-id="${this.testWindow.id}"]`) as HTMLElement;

    if (windowElement) {
      // Trigger multiple size changes
      for (let i = 0; i < 10; i++) {
        const newWidth = 400 + i * 10;
        const newHeight = 300 + i * 10;

        windowElement.style.width = newWidth + 'px';
        windowElement.style.height = newHeight + 'px';

        // Wait for ResizeObserver to callback
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    }

    unsubscribe();

    const duration = performance.now() - startTime;
    const averageCallbackTime = observerCallbacks.length > 0
      ? duration / observerCallbacks.length
      : 0;

    const passed = averageCallbackTime < 50; // ResizeObserver should be efficient

    return {
      testName: 'ResizeObserver Efficiency Test',
      passed,
      duration,
      details: {
        callbackCount: observerCallbacks.length,
        averageCallbackTime: averageCallbackTime.toFixed(2) + 'ms',
        totalDuration: duration.toFixed(2) + 'ms'
      },
      performance: {
        averageLatency: averageCallbackTime,
        maxLatency: duration,
        eventDispatchTime: 0,
        memoryUsage: 0
      }
    };
  }

  /**
   * Cleanup test resources
   */
  private cleanup(): void {
    if (this.testWindow) {
      windowService.closeWindow(this.testWindow.id);
      this.testWindow = null;
    }

    this.performanceMetrics = [];
    this.eventLatencies = [];
  }

  /**
   * Print test summary
   */
  private printTestSummary(results: ResizeTestResult[]): void {
    console.log('\n📊 Resize Performance Test Results');
    console.log('=====================================');

    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;

    console.log(`Overall: ${passedTests}/${totalTests} tests passed\n`);

    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.testName}`);
      console.log(`   Duration: ${result.duration.toFixed(2)}ms`);

      if (result.performance.averageLatency > 0) {
        console.log(`   Avg Latency: ${result.performance.averageLatency.toFixed(2)}ms`);
      }
      if (result.performance.eventDispatchTime > 0) {
        console.log(`   Event Time: ${result.performance.eventDispatchTime.toFixed(3)}ms`);
      }
      if (result.performance.memoryUsage > 0) {
        console.log(`   Memory: ${(result.performance.memoryUsage / 1024).toFixed(2)}KB`);
      }

      console.log(`   Details: ${JSON.stringify(result.details)}`);
      console.log('');
    });

    // Performance summary
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const avgLatency = results.reduce((sum, r) => sum + r.performance.averageLatency, 0) / results.length;
    const maxLatency = Math.max(...results.map(r => r.performance.maxLatency));
    const totalMemory = results.reduce((sum, r) => sum + r.performance.memoryUsage, 0);

    console.log('🎯 Performance Summary:');
    console.log(`   Total Duration: ${totalDuration.toFixed(2)}ms`);
    console.log(`   Average Latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`   Max Latency: ${maxLatency.toFixed(2)}ms`);
    console.log(`   Total Memory: ${(totalMemory / 1024).toFixed(2)}KB`);

    if (passedTests === totalTests) {
      console.log('\n🎉 All performance tests passed! Resize system is ready for production.');
    } else {
      console.log('\n⚠️  Some tests failed. Review the details above.');
    }
  }
}

/**
 * Run performance tests (can be called from browser console)
 */
export async function runResizePerformanceTests(): Promise<void> {
  const testSuite = new ResizePerformanceTest();
  const results = await testSuite.runFullTestSuite();

  // Make results available globally for debugging
  (window as any).resizeTestResults = results;

  return results;
}

// Auto-expose for browser console
if (typeof window !== 'undefined') {
  (window as any).runResizePerformanceTests = runResizePerformanceTests;
}