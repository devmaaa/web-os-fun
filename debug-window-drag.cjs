#!/usr/bin/env node

// Debug script to check window drag functionality
console.log('🔍 Debugging Window Drag Issues...\n');

// Check the code for potential issues
const checkCode = () => {
  console.log('\n🔧 Checking code for drag implementation...');

  const fs = require('fs');
  const path = require('path');

  // Check WindowManager
  const wmPath = path.join(__dirname, 'src/apps/os-shell/components/WindowManager.tsx');
  const wmContent = fs.readFileSync(wmPath, 'utf8');

  const hasMouseDown = wmContent.includes('onMouseDown={(e) => handleMouseDown(e, window.id)}');
  const hasHandleMouseDown = wmContent.includes('const handleMouseDown');
  const hasGlobalListeners = wmContent.includes('document.addEventListener');

  console.log(`WindowChrome onMouseDown prop: ${hasMouseDown ? '✅' : '❌'}`);
  console.log(`handleMouseDown function: ${hasHandleMouseDown ? '✅' : '❌'}`);
  console.log(`Global mouse listeners: ${hasGlobalListeners ? '✅' : '❌'}`);

  // Check WindowChrome
  const wcPath = path.join(__dirname, 'src/core/window-manager/components/WindowChrome.tsx');
  const wcContent = fs.readFileSync(wcPath, 'utf8');

  const hasTitleMouseDown = wcContent.includes('onMouseDown={props.onMouseDown}');
  const hasGrabCursor = wcContent.includes("cursor: 'grab'");

  console.log(`Title bar onMouseDown: ${hasTitleMouseDown ? '✅' : '❌'}`);
  console.log(`Grab cursor style: ${hasGrabCursor ? '✅' : '❌'}`);

  // Check window manager service
  const wsPath = path.join(__dirname, 'src/core/window-manager/window-service.ts');
  const wsContent = fs.readFileSync(wsPath, 'utf8');

  const hasStartDrag = wsContent.includes('startDrag(id: string)');
  const hasUpdatePosition = wsContent.includes('updateWindowPosition');

  console.log(`startDrag method: ${hasStartDrag ? '✅' : '❌'}`);
  console.log(`updateWindowPosition method: ${hasUpdatePosition ? '✅' : '❌'}`);

  return {
    wmOk: hasMouseDown && hasHandleMouseDown && hasGlobalListeners,
    wcOk: hasTitleMouseDown && hasGrabCursor,
    wsOk: hasStartDrag && hasUpdatePosition
  };
};

// Main debug function
const debug = () => {
  const codeChecks = checkCode();

  console.log('\n📊 Debug Summary:');
  console.log(`WindowManager code: ${codeChecks.wmOk ? '✅' : '❌'}`);
  console.log(`WindowChrome code: ${codeChecks.wcOk ? '✅' : '❌'}`);
  console.log(`WindowService code: ${codeChecks.wsOk ? '✅' : '❌'}`);

  if (!codeChecks.wmOk || !codeChecks.wcOk || !codeChecks.wsOk) {
    console.log('\n🚨 Code issues detected. Please check the implementation.');
    return;
  }

  console.log('\n✅ All checks passed. If dragging still doesn\'t work:');
  console.log('1. Open browser dev tools (F12)');
  console.log('2. Go to http://localhost:3203');
  console.log('3. Try to drag a window');
  console.log('4. Check Console for any JavaScript errors');
  console.log('5. Check if mouse events are firing on the title bar');
  console.log('6. Verify window position updates in the DOM');
  console.log('7. Check if the window element has the correct styles applied');
};

debug();