import React from 'react';
import { DataSource } from '@/types';
import Card, { CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { format } from 'date-fns';

interface DataSourceListProps {
  dataSources: DataSource[];
  onEdit: (dataSource: DataSource) => void;
  onDelete: (dataSource: DataSource) => void;
  onActivate: (dataSource: DataSource) => void;
  onDeactivate: (dataSource: DataSource) => void;
  isLoading?: boolean;
}

export const DataSourceList: React.FC<DataSourceListProps> = ({
  dataSources,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="ml-3 text-gray-600 dark:text-gray-300">Loading data sources...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dataSources.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-600 dark:text-gray-300">No data sources found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Data Sources</h2>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {dataSources.map((source) => (
                <tr key={source.id}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{source.name}</div>
                    {source.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {source.description}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                      {source.type}
                    </span>
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap">
                    {source.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        Inactive
                      </span>
                    )}
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(source.updated_at), 'MMM d, yyyy')}
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button 
                      onClick={() => onEdit(source)} 
                      size="xs" 
                      variant="secondary"
                    >
                      Edit
                    </Button>
                    
                    {source.is_active ? (
                      <Button 
                        onClick={() => onDeactivate(source)} 
                        size="xs" 
                        variant="secondary"
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => onActivate(source)} 
                        size="xs" 
                        variant="secondary"
                      >
                        Activate
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => onDelete(source)} 
                      size="xs" 
                      variant="danger"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}; 