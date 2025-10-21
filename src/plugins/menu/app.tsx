import { Component } from 'solid-js';

const MenuApp: Component = () => {
  return (
    <div class="h-full flex flex-col">
      <div class="bg-orange-600 text-white p-4">
        <h2 class="text-xl font-bold">Menu Editor</h2>
        <p class="text-sm opacity-90">Menu Item Management</p>
      </div>
      <div class="flex-1 p-4">
        <div class="mb-4 flex gap-2">
          <button class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Add Item
          </button>
          <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Add Category
          </button>
        </div>
        
        <div class="space-y-6">
          <div>
            <h3 class="font-semibold mb-3 text-lg">Appetizers</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="border rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                  <h4 class="font-medium">Caesar Salad</h4>
                  <span class="text-green-600 font-medium">$8.99</span>
                </div>
                <p class="text-sm text-gray-600 mb-2">Romaine lettuce, parmesan, croutons, caesar dressing</p>
                <div class="flex gap-2">
                  <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Vegetarian</span>
                  <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Available</span>
                </div>
                <div class="mt-3 flex gap-2">
                  <button class="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                  <button class="text-red-500 hover:text-red-700 text-sm">Remove</button>
                </div>
              </div>
              
              <div class="border rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                  <h4 class="font-medium">Garlic Bread</h4>
                  <span class="text-green-600 font-medium">$5.99</span>
                </div>
                <p class="text-sm text-gray-600 mb-2">Toasted bread with garlic butter and herbs</p>
                <div class="flex gap-2">
                  <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Vegetarian</span>
                  <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Available</span>
                </div>
                <div class="mt-3 flex gap-2">
                  <button class="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                  <button class="text-red-500 hover:text-red-700 text-sm">Remove</button>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 class="font-semibold mb-3 text-lg">Main Courses</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="border rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                  <h4 class="font-medium">Classic Burger</h4>
                  <span class="text-green-600 font-medium">$12.99</span>
                </div>
                <p class="text-sm text-gray-600 mb-2">Beef patty, lettuce, tomato, onion, pickles, special sauce</p>
                <div class="flex gap-2">
                  <span class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Contains Nuts</span>
                  <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Available</span>
                </div>
                <div class="mt-3 flex gap-2">
                  <button class="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                  <button class="text-red-500 hover:text-red-700 text-sm">Remove</button>
                </div>
              </div>
              
              <div class="border rounded-lg p-4 opacity-75">
                <div class="flex justify-between items-start mb-2">
                  <h4 class="font-medium">Grilled Salmon</h4>
                  <span class="text-green-600 font-medium">$18.99</span>
                </div>
                <p class="text-sm text-gray-600 mb-2">Atlantic salmon, lemon butter, seasonal vegetables</p>
                <div class="flex gap-2">
                  <span class="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Gluten-Free</span>
                  <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">Unavailable</span>
                </div>
                <div class="mt-3 flex gap-2">
                  <button class="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                  <button class="text-green-500 hover:text-green-700 text-sm">Available</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuApp;