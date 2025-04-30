import React, { useState } from 'react';
import { Filter } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ObjectFiltersProps {
  onFilterChange: (filters: Filter) => void;
  dataSources: Array<{ id: string; name: string }>;
  className?: string;
}

export const ObjectFilters: React.FC<ObjectFiltersProps> = ({
  onFilterChange,
  dataSources,
  className = '',
}) => {
  const [type, setType] = useState<string>('');
  const [tag, setTag] = useState<string>('');
  const [sourceId, setSourceId] = useState<string>('');

  const handleFilterApply = () => {
    const filters: Filter = {};
    
    if (type) filters.type = type;
    if (tag) filters.tag = tag;
    if (sourceId) filters.source_id = sourceId;
    
    onFilterChange(filters);
  };

  const handleReset = () => {
    setType('');
    setTag('');
    setSourceId('');
    onFilterChange({});
  };

  return (
    <Card className={`mb-4 ${className}`}>
      <CardContent>
        <h3 className="text-lg font-medium mb-3">Filter Objects</h3>
        
        <div className="space-y-3">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Object Type
            </label>
            <select
              id="type"
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="node">Node</option>
              <option value="way">Way</option>
              <option value="relation">Relation</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="tag" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tag (e.g., "highway", "building")
            </label>
            <input
              type="text"
              id="tag"
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Enter tag"
            />
          </div>
          
          {dataSources.length > 0 && (
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Source
              </label>
              <select
                id="source"
                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
              >
                <option value="">All Sources</option>
                {dataSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex space-x-2 pt-2">
            <Button onClick={handleFilterApply} size="sm" fullWidth>
              Apply Filters
            </Button>
            <Button onClick={handleReset} variant="secondary" size="sm" fullWidth>
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 