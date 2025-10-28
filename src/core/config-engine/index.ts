import { createStore } from 'solid-js/store';
import { eventBus } from '../event-bus';

// Schema types for configuration
export interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum' | 'date';
  label: string;
  description?: string;
  required?: boolean;
  default?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: any[];
  };
  ui?: {
    component?: 'input' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date';
    placeholder?: string;
    help?: string;
  };
}

export interface EntitySchema {
  name: string;
  displayName: string;
  description?: string;
  fields: Record<string, FieldSchema>;
  permissions?: {
    read: string[];
    write: string[];
    delete: string[];
  };
  workflows?: WorkflowSchema[];
}

export interface WorkflowSchema {
  id: string;
  name: string;
  initial: string;
  states: Record<string, {
    displayName: string;
    description?: string;
    transitions: Record<string, {
      target: string;
      displayName: string;
      action?: string;
      permission?: string;
    }>;
  }>;
}

export interface ConfigSchema {
  entities: Record<string, EntitySchema>;
  global: Record<string, FieldSchema>;
  permissions: Record<string, {
    displayName: string;
    description?: string;
    category: string;
  }>;
}

// Default restaurant configuration schema
const defaultSchema: ConfigSchema = {
  entities: {
    order: {
      name: 'order',
      displayName: 'Order',
      description: 'Customer orders and transactions',
      fields: {
        id: {
          type: 'string',
          label: 'Order ID',
          required: true,
          ui: { component: 'input', placeholder: 'Auto-generated' }
        },
        tableId: {
          type: 'string',
          label: 'Table',
          required: true,
          ui: { component: 'select' }
        },
        items: {
          type: 'array',
          label: 'Order Items',
          required: true,
          ui: { component: 'textarea', help: 'JSON array of order items' }
        },
        subtotal: {
          type: 'number',
          label: 'Subtotal',
          required: true,
          validation: { min: 0 },
          ui: { component: 'number' }
        },
        tax: {
          type: 'number',
          label: 'Tax',
          required: true,
          validation: { min: 0 },
          ui: { component: 'number' }
        },
        total: {
          type: 'number',
          label: 'Total',
          required: true,
          validation: { min: 0 },
          ui: { component: 'number' }
        },
        status: {
          type: 'enum',
          label: 'Status',
          required: true,
          default: 'pending',
          validation: { options: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'paid'] },
          ui: { component: 'select' }
        },
        createdAt: {
          type: 'date',
          label: 'Created At',
          required: true,
          ui: { component: 'date' }
        }
      },
      permissions: {
        read: ['order.read', 'order.list'],
        write: ['order.create', 'order.update'],
        delete: ['order.delete']
      },
      workflows: [{
        id: 'order-lifecycle',
        name: 'Order Lifecycle',
        initial: 'pending',
        states: {
          pending: {
            displayName: 'Pending',
            transitions: {
              confirm: {
                target: 'confirmed',
                displayName: 'Confirm Order',
                permission: 'order.confirm'
              },
              cancel: {
                target: 'cancelled',
                displayName: 'Cancel',
                permission: 'order.cancel'
              }
            }
          },
          confirmed: {
            displayName: 'Confirmed',
            transitions: {
              startPrep: {
                target: 'preparing',
                displayName: 'Start Preparation',
                permission: 'order.prepare'
              }
            }
          },
          preparing: {
            displayName: 'Preparing',
            transitions: {
              markReady: {
                target: 'ready',
                displayName: 'Mark Ready',
                permission: 'order.ready'
              }
            }
          },
          ready: {
            displayName: 'Ready for Pickup',
            transitions: {
              serve: {
                target: 'served',
                displayName: 'Mark Served',
                permission: 'order.serve'
              }
            }
          },
          served: {
            displayName: 'Served',
            transitions: {
              pay: {
                target: 'paid',
                displayName: 'Process Payment',
                permission: 'order.pay'
              }
            }
          },
          paid: {
            displayName: 'Paid',
            transitions: {}
          }
        }
      }]
    },
    menuItem: {
      name: 'menuItem',
      displayName: 'Menu Item',
      description: 'Restaurant menu items and pricing',
      fields: {
        id: {
          type: 'string',
          label: 'Item ID',
          required: true,
          ui: { component: 'input' }
        },
        name: {
          type: 'string',
          label: 'Name',
          required: true,
          ui: { component: 'input', placeholder: 'Enter item name' }
        },
        description: {
          type: 'string',
          label: 'Description',
          ui: { component: 'textarea', placeholder: 'Item description' }
        },
        price: {
          type: 'number',
          label: 'Price',
          required: true,
          validation: { min: 0 },
          ui: { component: 'number', placeholder: '0.00' }
        },
        category: {
          type: 'string',
          label: 'Category',
          required: true,
          ui: { component: 'select' }
        },
        available: {
          type: 'boolean',
          label: 'Available',
          default: true,
          ui: { component: 'checkbox' }
        },
        dietaryInfo: {
          type: 'array',
          label: 'Dietary Information',
          validation: { options: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free'] },
          ui: { component: 'select' }
        }
      },
      permissions: {
        read: ['menu.read', 'menu.list'],
        write: ['menu.create', 'menu.update'],
        delete: ['menu.delete']
      }
    },
    table: {
      name: 'table',
      displayName: 'Table',
      description: 'Restaurant tables and seating',
      fields: {
        id: {
          type: 'string',
          label: 'Table ID',
          required: true,
          ui: { component: 'input' }
        },
        number: {
          type: 'string',
          label: 'Table Number',
          required: true,
          ui: { component: 'input' }
        },
        capacity: {
          type: 'number',
          label: 'Capacity',
          required: true,
          validation: { min: 1, max: 20 },
          ui: { component: 'number' }
        },
        status: {
          type: 'enum',
          label: 'Status',
          required: true,
          default: 'available',
          validation: { options: ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'] },
          ui: { component: 'select' }
        },
        location: {
          type: 'string',
          label: 'Location',
          ui: { component: 'input', placeholder: 'e.g., Patio, Main Hall' }
        }
      },
      permissions: {
        read: ['table.read', 'table.list'],
        write: ['table.create', 'table.update'],
        delete: ['table.delete']
      }
    }
  },
  global: {
    restaurantName: {
      type: 'string',
      label: 'Restaurant Name',
      required: true,
      default: 'My Restaurant',
      ui: { component: 'input', placeholder: 'Enter restaurant name' }
    },
    taxRate: {
      type: 'number',
      label: 'Tax Rate',
      required: true,
      default: 0.08,
      validation: { min: 0, max: 1 },
      ui: { component: 'number', placeholder: '0.08' }
    },
    currency: {
      type: 'string',
      label: 'Currency',
      required: true,
      default: 'USD',
      ui: { component: 'input', placeholder: 'USD' }
    },
    timezone: {
      type: 'string',
      label: 'Timezone',
      required: true,
      default: 'America/New_York',
      ui: { component: 'input', placeholder: 'America/New_York' }
    },
    autoPrintOrders: {
      type: 'boolean',
      label: 'Auto-print Orders',
      default: true,
      ui: { component: 'checkbox' }
    }
  },
  permissions: {
    'order.read': {
      displayName: 'View Orders',
      description: 'View order details and lists',
      category: 'Orders'
    },
    'order.create': {
      displayName: 'Create Orders',
      description: 'Create new orders',
      category: 'Orders'
    },
    'order.update': {
      displayName: 'Update Orders',
      description: 'Modify existing orders',
      category: 'Orders'
    },
    'order.delete': {
      displayName: 'Delete Orders',
      description: 'Delete orders',
      category: 'Orders'
    },
    'menu.read': {
      displayName: 'View Menu',
      description: 'View menu items and categories',
      category: 'Menu'
    },
    'menu.create': {
      displayName: 'Create Menu Items',
      description: 'Add new menu items',
      category: 'Menu'
    },
    'menu.update': {
      displayName: 'Update Menu Items',
      description: 'Modify menu items',
      category: 'Menu'
    },
    'menu.delete': {
      displayName: 'Delete Menu Items',
      description: 'Remove menu items',
      category: 'Menu'
    },
    'table.read': {
      displayName: 'View Tables',
      description: 'View table status and layout',
      category: 'Tables'
    },
    'table.create': {
      displayName: 'Create Tables',
      description: 'Add new tables',
      category: 'Tables'
    },
    'table.update': {
      displayName: 'Update Tables',
      description: 'Modify table information',
      category: 'Tables'
    },
    'table.delete': {
      displayName: 'Delete Tables',
      description: 'Remove tables',
      category: 'Tables'
    },
    'admin.system': {
      displayName: 'System Administration',
      description: 'Access system settings and configuration',
      category: 'System'
    }
  }
};

// Configuration store
const [config, setConfig] = createStore<Record<string, any>>({});
const [schema, setSchema] = createStore<ConfigSchema>(defaultSchema);

// Initialize with default values
const initializeConfig = () => {
  const defaultValues: Record<string, any> = {};
  
  // Set global defaults
  Object.entries(schema.global).forEach(([key, field]) => {
    if (field.default !== undefined) {
      defaultValues[key] = field.default;
    }
  });
  
  setConfig(defaultValues);
  
  // Emit config initialized event
  eventBus.emitSync('config:initialized', { schema: defaultSchema, config: defaultValues });
};

// Config Engine API
export interface ConfigEngine {
  schema: ConfigSchema;
  config: Record<string, any>;
  get: (key: string) => any;
  set: (key: string, value: any) => void;
  getEntitySchema: (entityName: string) => EntitySchema | undefined;
  validateField: (entityName: string, field: string, value: any) => { valid: boolean; errors: string[] };
  validateEntity: (entityName: string, data: Record<string, any>) => { valid: boolean; errors: Record<string, string[]> };
  getWorkflowTransitions: (entityName: string, currentState: string, userPermissions?: string[]) => string[];
  updateSchema: (newSchema: Partial<ConfigSchema>) => void;
  resetToDefaults: () => void;
}

export const configEngine: ConfigEngine = {
  get schema() { return schema; },
  get config() { return config; },
  
  get(key: string) {
    return config[key];
  },
  
  set(key: string, value: any) {
    setConfig(key, value);
    eventBus.emitSync('config:changed', { key, value });
  },
  
  getEntitySchema(entityName: string) {
    return schema.entities[entityName];
  },
  
  validateField(entityName: string, field: string, value: any) {
    const entitySchema = schema.entities[entityName];
    if (!entitySchema) {
      return { valid: false, errors: [`Entity ${entityName} not found`] };
    }
    
    const fieldSchema = entitySchema.fields[field];
    if (!fieldSchema) {
      return { valid: false, errors: [`Field ${field} not found in ${entityName}`] };
    }
    
    const errors: string[] = [];
    
    // Type validation
    if (fieldSchema.type === 'number' && isNaN(Number(value))) {
      errors.push('Must be a valid number');
    }
    
    if (fieldSchema.type === 'boolean' && typeof value !== 'boolean') {
      errors.push('Must be true or false');
    }
    
    if (fieldSchema.type === 'array' && !Array.isArray(value)) {
      errors.push('Must be an array');
    }
    
    // Required validation
    if (fieldSchema.required && (value === null || value === undefined || value === '')) {
      errors.push('This field is required');
    }
    
    // Range validation
    if (fieldSchema.validation) {
      if (fieldSchema.validation.min !== undefined && value < fieldSchema.validation.min) {
        errors.push(`Must be at least ${fieldSchema.validation.min}`);
      }
      if (fieldSchema.validation.max !== undefined && value > fieldSchema.validation.max) {
        errors.push(`Must be at most ${fieldSchema.validation.max}`);
      }
      if (fieldSchema.validation.pattern && !new RegExp(fieldSchema.validation.pattern).test(value)) {
        errors.push('Invalid format');
      }
    }
    
    return { valid: errors.length === 0, errors };
  },
  
  validateEntity(entityName: string, data: Record<string, any>) {
    const entitySchema = schema.entities[entityName];
    if (!entitySchema) {
      return { valid: false, errors: { _entity: [`Entity ${entityName} not found`] } };
    }
    
    const errors: Record<string, string[]> = {};
    let valid = true;
    
    Object.entries(entitySchema.fields).forEach(([fieldName, fieldSchema]) => {
      const validation = this.validateField(entityName, fieldName, data[fieldName]);
      if (!validation.valid) {
        errors[fieldName] = validation.errors;
        valid = false;
      }
    });
    
    return { valid, errors };
  },
  
  getWorkflowTransitions(entityName: string, currentState: string, userPermissions: string[] = []) {
    const entitySchema = schema.entities[entityName];
    if (!entitySchema || !entitySchema.workflows) {
      return [];
    }
    
    const transitions: string[] = [];
    
    entitySchema.workflows.forEach(workflow => {
      const state = workflow.states[currentState];
      if (state) {
        Object.entries(state.transitions).forEach(([transitionId, transition]) => {
          if (!transition.permission || userPermissions.includes(transition.permission)) {
            transitions.push(transitionId);
          }
        });
      }
    });
    
    return transitions;
  },
  
  updateSchema(newSchema: Partial<ConfigSchema>) {
    setSchema(newSchema);
    eventBus.emitSync('config:schema-updated', { schema: newSchema });
  },
  
  resetToDefaults() {
    initializeConfig();
  }
};

// Initialize on import
initializeConfig();

