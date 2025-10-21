import { Component } from 'solid-js';

const SettingsApp: Component = () => {
  return (
    <div class="h-full flex flex-col">
      <div class="bg-gray-700 text-white p-4">
        <h2 class="text-xl font-bold">Settings</h2>
        <p class="text-sm opacity-90">System Configuration</p>
      </div>
      <div class="flex-1 p-4">
        <div class="space-y-6">
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-4">Restaurant Information</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Restaurant Name</label>
                <input type="text" value="DineApp Demo" class="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Phone Number</label>
                <input type="tel" value="(555) 123-4567" class="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Email</label>
                <input type="email" value="info@dineapp.com" class="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Address</label>
                <input type="text" value="123 Main St, City, State" class="w-full border rounded px-3 py-2" />
              </div>
            </div>
          </div>
          
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-4">Business Settings</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Tax Rate (%)</label>
                <input type="number" value="8" step="0.1" class="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Currency</label>
                <select class="w-full border rounded px-3 py-2">
                  <option value="USD" selected>USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Timezone</label>
                <select class="w-full border rounded px-3 py-2">
                  <option value="America/New_York" selected>Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Language</label>
                <select class="w-full border rounded px-3 py-2">
                  <option value="en" selected>English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold mb-4">System Preferences</h3>
            <div class="space-y-3">
              <label class="flex items-center">
                <input type="checkbox" checked class="mr-2" />
                <span class="text-sm">Auto-print orders to kitchen</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" checked class="mr-2" />
                <span class="text-sm">Enable email notifications</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" class="mr-2" />
                <span class="text-sm">Enable SMS notifications</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" checked class="mr-2" />
                <span class="text-sm">Allow online ordering</span>
              </label>
            </div>
          </div>
          
          <div class="flex gap-2">
            <button class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
              Save Changes
            </button>
            <button class="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsApp;