import { Component } from 'solid-js';

const AnalyticsApp: Component = () => {
  return (
    <div class="h-full flex flex-col">
      <div class="bg-purple-600 text-white p-4">
        <h2 class="text-xl font-bold">Analytics Dashboard</h2>
        <p class="text-sm opacity-90">Business Insights & Reports</p>
      </div>
      <div class="flex-1 p-4">
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="bg-blue-50 p-4 rounded-lg border">
            <h3 class="text-sm font-medium text-gray-600">Today's Revenue</h3>
            <p class="text-2xl font-bold text-blue-600">$2,847</p>
            <p class="text-xs text-green-600">+12% from yesterday</p>
          </div>
          <div class="bg-green-50 p-4 rounded-lg border">
            <h3 class="text-sm font-medium text-gray-600">Orders</h3>
            <p class="text-2xl font-bold text-green-600">156</p>
            <p class="text-xs text-green-600">+8% from yesterday</p>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg border">
            <h3 class="text-sm font-medium text-gray-600">Avg Order Value</h3>
            <p class="text-2xl font-bold text-yellow-600">$18.25</p>
            <p class="text-xs text-red-600">-3% from yesterday</p>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg border">
            <h3 class="text-sm font-medium text-gray-600">Customers</h3>
            <p class="text-2xl font-bold text-purple-600">89</p>
            <p class="text-xs text-green-600">+15% from yesterday</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-4">Sales Overview</h3>
            <div class="h-48 bg-gray-100 rounded flex items-center justify-center">
              <p class="text-gray-500">Sales Chart Placeholder</p>
            </div>
          </div>
          
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-4">Top Selling Items</h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm">Classic Burger</span>
                <span class="text-sm font-medium">45 orders</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">Caesar Salad</span>
                <span class="text-sm font-medium">32 orders</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">French Fries</span>
                <span class="text-sm font-medium">28 orders</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">Coca Cola</span>
                <span class="text-sm font-medium">25 orders</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsApp;