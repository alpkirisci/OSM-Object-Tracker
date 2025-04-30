import React, { useState } from 'react';
import { DataSource, DataSourceCreate, DataSourceUpdate } from '@/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardContent, CardFooter } from '@/components/ui/Card';

interface DataSourceFormProps {
  initialData?: DataSource;
  onSubmit: (data: DataSourceCreate | DataSourceUpdate) => Promise<void>;
  onCancel: () => void;
}

export const DataSourceForm: React.FC<DataSourceFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState<'websocket' | 'rest'>(initialData?.type || 'websocket');
  const [connectionInfo, setConnectionInfo] = useState<string>(
    initialData ? JSON.stringify(initialData.connection_info, null, 2) : JSON.stringify({ url: '' }, null, 2)
  );
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate form
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    // Parse connection info
    let parsedConnectionInfo: Record<string, any>;
    try {
      parsedConnectionInfo = JSON.parse(connectionInfo);
    } catch (err) {
      setError('Invalid connection info JSON');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData: DataSourceCreate | DataSourceUpdate = {
        name,
        description: description || undefined,
        type,
        connection_info: parsedConnectionInfo,
        is_active: isActive,
      };
      
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">
          {initialData ? 'Edit Data Source' : 'Create New Data Source'}
        </h2>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger-light text-danger px-4 py-2 rounded-md">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              rows={3}
            />
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type <span className="text-danger">*</span>
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as 'websocket' | 'rest')}
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              required
            >
              <option value="websocket">WebSocket</option>
              <option value="rest">REST API</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="connectionInfo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Connection Info (JSON) <span className="text-danger">*</span>
            </label>
            <textarea
              id="connectionInfo"
              value={connectionInfo}
              onChange={(e) => setConnectionInfo(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono text-sm"
              rows={6}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {type === 'websocket' ? 'For WebSockets, include URL and any authentication details.' : 'For REST, include base URL, endpoints, and authentication details.'}
            </p>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-2">
        <Button 
          onClick={onCancel} 
          variant="secondary"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </Button>
      </CardFooter>
    </Card>
  );
}; 