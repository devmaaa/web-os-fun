import { Component } from 'solid-js';

const POSApp: Component = () => {

  return (
    <div class="h-full flex flex-col">
      <div class="bg-blue-600 text-white p-4">
        <h2 class="text-xl font-bold">POS Terminal</h2>
        <p class="text-sm opacity-90">Point of Sale System</p>
      </div>
      <div class="flex-1 p-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-2">Quick Actions</h3>
            <div class="space-y-2">
              <button class="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                New Order
              </button>
              <button class="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                View Orders
              </button>
              <button class="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
                Table Management
              </button>
            </div>
          </div>
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-2">Current Order</h3>
            <div class="text-gray-500 text-center py-8">
              No active order
            </div>
          </div>
        </div>
        <div class="mt-4 border rounded-lg p-4">
          <h3 class="font-semibold mb-2">Recent Activity</h3>
          <div class="text-sm text-gray-600">
            <p>• Order #1234 completed - $45.50</p>
            <p>• Table 5 seated - 4 guests</p>
            <p>• Order #1235 started</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSApp;