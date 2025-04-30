import React from 'react';
import { OSMObject } from '@/types';
import Card, { CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatTags } from '@/utils/map-utils';
import { format } from 'date-fns';

interface ObjectDetailProps {
  object: OSMObject;
  onClose: () => void;
  className?: string;
}

export const ObjectDetail: React.FC<ObjectDetailProps> = ({
  object,
  onClose,
  className = '',
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy, HH:mm:ss');
    } catch (error) {
      return dateString;
    }
  };

  const renderTagsTable = () => {
    if (!object.tags || Object.keys(object.tags).length === 0) {
      return <p className="text-gray-500 dark:text-gray-400">No tags available</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Key</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {Object.entries(object.tags).map(([key, value]) => (
              <tr key={key}>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{key}</td>
                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{value.toString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">OSM Object Details</h3>
          <Button onClick={onClose} variant="secondary" size="sm">
            Close
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">ID</h4>
            <p>{object.id}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">OSM ID</h4>
            <p>{object.osm_id}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</h4>
            <p>{object.type}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Source ID</h4>
            <p>{object.source_id}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</h4>
            <p>{formatDate(object.created_at)}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated</h4>
            <p>{formatDate(object.updated_at)}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tags</h4>
            {renderTagsTable()}
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={() => window.open(`https://www.openstreetmap.org/${object.type}/${object.osm_id}`, '_blank')}
          fullWidth
        >
          View on OpenStreetMap
        </Button>
      </CardFooter>
    </Card>
  );
}; 