import { Component } from 'solid-js';

const InventoryApp: Component = () => {
  return (
    <div class="h-full flex flex-col">
      <div class="bg-green-600 text-white p-4">
        <h2 class="text-xl font-bold">Inventory Management</h2>
        <p class="text-sm opacity-90">Stock Tracking & Management</p>
      </div>
      <div class="flex-1 p-4">
        <div class="mb-4 flex gap-2">
          <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Add Item
          </button>
          <button class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            New Order
          </button>
          <button class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
            Reports
          </button>
        </div>
        
        <div class="border rounded-lg overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-100">
              <tr>
                <th class="text-left p-3 border-b">Item</th>
                <th class="text-left p-3 border-b">Category</th>
                <th class="text-left p-3 border-b">Stock</th>
                <th class="text-left p-3 border-b">Status</th>
                <th class="text-left p-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b hover:bg-gray-50">
                <td class="p-3">Tomatoes</td>
                <td class="p-3">Produce</td>
                <td class="p-3">25 kg</td>
                <td class="p-3">
                  <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">In Stock</span>
                </td>
                <td class="p-3">
                  <button class="text-blue-500 hover:text-blue-700">Edit</button>
                </td>
              </tr>
              <tr class="border-b hover:bg-gray-50">
                <td class="p-3">Beef Patties</td>
                <td class="p-3">Meat</td>
                <td class="p-3">8 kg</td>
                <td class="p-3">
                  <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Low Stock</span>
                </td>
                <td class="p-3">
                  <button class="text-blue-500 hover:text-blue-700">Edit</button>
                </td>
              </tr>
              <tr class="border-b hover:bg-gray-50">
                <td class="p-3">Lettuce</td>
                <td class="p-3">Produce</td>
                <td class="p-3">3 kg</td>
                <td class="p-3">
                  <span class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Critical</span>
                </td>
                <td class="p-3">
                  <button class="text-blue-500 hover:text-blue-700">Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryApp;