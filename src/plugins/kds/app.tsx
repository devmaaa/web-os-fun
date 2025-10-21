import { Component } from 'solid-js';

const KDSApp: Component = () => {

  return (
    <div class="h-full flex flex-col">
      <div class="bg-red-600 text-white p-4">
        <h2 class="text-xl font-bold">Kitchen Display System</h2>
        <p class="text-sm opacity-90">Order Management</p>
      </div>
      <div class="flex-1 p-4">
        <div class="grid grid-cols-3 gap-4">
          <div class="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-semibold">Order #1234</h3>
              <span class="text-xs bg-yellow-500 text-white px-2 py-1 rounded">Pending</span>
            </div>
            <div class="text-sm">
              <p class="font-medium">Table 5</p>
              <ul class="mt-2 space-y-1">
                <li>• Burger x2</li>
                <li>• Fries x2</li>
                <li>• Coke x2</li>
              </ul>
            </div>
            <div class="mt-3 flex gap-2">
              <button class="bg-green-500 text-white px-3 py-1 rounded text-sm">Start</button>
              <button class="bg-red-500 text-white px-3 py-1 rounded text-sm">Cancel</button>
            </div>
          </div>
          
          <div class="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-semibold">Order #1235</h3>
              <span class="text-xs bg-blue-500 text-white px-2 py-1 rounded">Prepping</span>
            </div>
            <div class="text-sm">
              <p class="font-medium">Table 3</p>
              <ul class="mt-2 space-y-1">
                <li>• Caesar Salad</li>
                <li>• Grilled Chicken</li>
              </ul>
            </div>
            <div class="mt-3 flex gap-2">
              <button class="bg-orange-500 text-white px-3 py-1 rounded text-sm">Ready</button>
            </div>
          </div>
          
          <div class="border-l-4 border-green-500 bg-green-50 p-4 rounded">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-semibold">Order #1233</h3>
              <span class="text-xs bg-green-500 text-white px-2 py-1 rounded">Ready</span>
            </div>
            <div class="text-sm">
              <p class="font-medium">Table 7</p>
              <ul class="mt-2 space-y-1">
                <li>• Pizza Margherita</li>
                <li>• Garlic Bread</li>
              </ul>
            </div>
            <div class="mt-3 flex gap-2">
              <button class="bg-purple-500 text-white px-3 py-1 rounded text-sm">Complete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KDSApp;