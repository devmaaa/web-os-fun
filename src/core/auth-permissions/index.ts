import { createStore } from 'solid-js/store';
import { eventBus } from '../event-bus';
import { configEngine } from '../config-engine';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: Date;
  permissions: string[];
}

export interface AuthEngine {
  get currentUser(): User | null;
  get currentSession(): AuthSession | null;
  get isAuthenticated(): boolean;
  get roles(): Role[];
  login: (username: string, password: string) => Promise<AuthSession>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canAccessEntity: (entityName: string, action: 'read' | 'write' | 'delete') => boolean;
  canPerformWorkflowTransition: (entityName: string, transition: string) => boolean;
  refreshSession: () => Promise<void>;
  createUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<User>;
  createRole: (roleData: Omit<Role, 'id'>) => Promise<Role>;
  assignRole: (userId: string, roleId: string) => Promise<void>;
}

// Default system roles
const defaultRoles: Role[] = [
  {
    id: 'admin',
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access',
    permissions: ['admin.system'],
    isSystem: true
  },
  {
    id: 'manager',
    name: 'manager',
    displayName: 'Manager',
    description: 'Restaurant management access',
    permissions: [
      'order.read', 'order.create', 'order.update', 'order.delete',
      'menu.read', 'menu.create', 'menu.update', 'menu.delete',
      'table.read', 'table.create', 'table.update', 'table.delete'
    ],
    isSystem: true
  },
  {
    id: 'server',
    name: 'server',
    displayName: 'Server',
    description: 'Wait staff access',
    permissions: [
      'order.read', 'order.create', 'order.update',
      'menu.read', 'table.read', 'table.update'
    ],
    isSystem: true
  },
  {
    id: 'kitchen',
    name: 'kitchen',
    displayName: 'Kitchen Staff',
    description: 'Kitchen and food preparation access',
    permissions: [
      'order.read', 'order.update',
      'menu.read'
    ],
    isSystem: true
  }
];

// Auth state
let currentUser: User | null = null;
let currentSession: AuthSession | null = null;
const [roles, setRoles] = createStore<Role[]>(defaultRoles);

// Mock user database (in real app, this would be in a backend)
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@restaurant.com',
    displayName: 'System Administrator',
    role: 'admin',
    permissions: defaultRoles.find(r => r.id === 'admin')!.permissions,
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    username: 'manager',
    email: 'manager@restaurant.com',
    displayName: 'Restaurant Manager',
    role: 'manager',
    permissions: defaultRoles.find(r => r.id === 'manager')!.permissions,
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '3',
    username: 'server1',
    email: 'server1@restaurant.com',
    displayName: 'John Server',
    role: 'server',
    permissions: defaultRoles.find(r => r.id === 'server')!.permissions,
    isActive: true,
    createdAt: new Date('2024-01-01')
  }
];

// Auth Engine implementation
export const authEngine: AuthEngine = {
  get currentUser() { return currentUser; },
  get currentSession() { return currentSession; },
  get isAuthenticated() { 
    return currentSession !== null && new Date(currentSession.expiresAt) > new Date(); 
  },
  get roles() { return roles; },
  
  async login(username: string, password: string): Promise<AuthSession> {
    // Mock authentication - in real app, this would call an API
    const user = mockUsers.find(u => u.username === username && u.isActive);
    
    if (!user) {
      throw new Error('Invalid credentials or user not found');
    }
    
    // Mock password check (in real app, use proper hashing)
    if (password !== 'password') {
      throw new Error('Invalid credentials');
    }
    
    // Create session
    const token = btoa(`${user.id}:${Date.now()}:${Math.random()}`);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const session: AuthSession = {
      user: { ...user, lastLogin: new Date() },
      token,
      expiresAt,
      permissions: user.permissions
    };
    
    currentUser = session.user;
    currentSession = session;
    
    // Store in localStorage for persistence
    localStorage.setItem('auth_session', JSON.stringify(session));
    
    // Emit events
    eventBus.emitSync('auth:login', { user: session.user });
    eventBus.emitSync('auth:session-changed', { session });
    
    return session;
  },
  
  async logout(): Promise<void> {
    const user = currentUser;
    
    currentUser = null;
    currentSession = null;
    localStorage.removeItem('auth_session');
    
    // Emit events
    eventBus.emitSync('auth:logout', { user });
    eventBus.emitSync('auth:session-changed', { session: null });
  },
  
  hasPermission(permission: string): boolean {
    if (!this.isAuthenticated) return false;
    return currentSession!.permissions.includes(permission);
  },
  
  hasAnyPermission(permissions: string[]): boolean {
    if (!this.isAuthenticated) return false;
    return permissions.some(p => this.hasPermission(p));
  },
  
  hasAllPermissions(permissions: string[]): boolean {
    if (!this.isAuthenticated) return false;
    return permissions.every(p => this.hasPermission(p));
  },
  
  canAccessEntity(entityName: string, action: 'read' | 'write' | 'delete'): boolean {
    const entitySchema = configEngine.getEntitySchema(entityName);
    if (!entitySchema || !entitySchema.permissions) {
      return false;
    }
    
    const requiredPermissions = entitySchema.permissions[action];
    return this.hasAnyPermission(requiredPermissions);
  },
  
  canPerformWorkflowTransition(entityName: string, transition: string): boolean {
    // This would need to be enhanced to track current state
    // For now, just check if user has workflow permissions
    return this.hasPermission(`${entityName}.update`);
  },
  
  async refreshSession(): Promise<void> {
    if (!currentSession) {
      throw new Error('No active session');
    }
    
    // Mock refresh - in real app, call refresh API
    const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    currentSession.expiresAt = newExpiresAt;
    
    const updatedSession = { ...currentSession, expiresAt: newExpiresAt };
    localStorage.setItem('auth_session', JSON.stringify(updatedSession));
    
    eventBus.emitSync('auth:session-refreshed', { session: updatedSession });
  },
  
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    if (!this.hasPermission('admin.system')) {
      throw new Error('Insufficient permissions');
    }
    
    const role = roles.find(r => r.id === userData.role);
    if (!role) {
      throw new Error('Invalid role');
    }
    
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      permissions: role.permissions,
      createdAt: new Date()
    };
    
    mockUsers.push(newUser);
    eventBus.emitSync('auth:user-created', { user: newUser });
    
    return newUser;
  },
  
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    if (!this.hasPermission('admin.system')) {
      throw new Error('Insufficient permissions');
    }
    
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    const updatedUser = { ...mockUsers[userIndex], ...updates };
    mockUsers[userIndex] = updatedUser;
    
    eventBus.emitSync('auth:user-updated', { user: updatedUser });
    
    return updatedUser;
  },
  
  async createRole(roleData: Omit<Role, 'id'>): Promise<Role> {
    if (!this.hasPermission('admin.system')) {
      throw new Error('Insufficient permissions');
    }
    
    const newRole: Role = {
      ...roleData,
      id: Date.now().toString()
    };
    
    setRoles(r => [...r, newRole]);
    eventBus.emitSync('auth:role-created', { role: newRole });
    
    return newRole;
  },
  
  async assignRole(userId: string, roleId: string): Promise<void> {
    if (!this.hasPermission('admin.system')) {
      throw new Error('Insufficient permissions');
    }
    
    const role = roles.find(r => r.id === roleId);
    if (!role) {
      throw new Error('Role not found');
    }
    
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      role: role.id,
      permissions: role.permissions
    };
    
    eventBus.emitSync('auth:role-assigned', { userId, roleId, role });
  }
};

// Initialize auth from localStorage
const initializeAuth = () => {
  try {
    const storedSession = localStorage.getItem('auth_session');
    if (storedSession) {
      const sessionData = JSON.parse(storedSession);
      const session: AuthSession = {
        ...sessionData,
        expiresAt: new Date(sessionData.expiresAt)
      };
      
      if (session.expiresAt > new Date()) {
        currentSession = session;
        currentUser = session.user;
        eventBus.emitSync('auth:session-restored', { session });
      } else {
        localStorage.removeItem('auth_session');
      }
    }
  } catch (error) {
    console.error('Failed to restore auth session:', error);
    localStorage.removeItem('auth_session');
  }
};

// Initialize on import
initializeAuth();