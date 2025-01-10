// components/ListingForm.tsx
'use client';

import { useState } from 'react';
import { Listing, EnergyType } from '@/lib/types/listing';

interface ListingFormProps {
  initialData?: Partial<Listing>;
  onSubmit: (data: Partial<Listing>) => Promise<void>;
  onCancel: () => void;
}

export function ListingForm({ initialData, onSubmit, onCancel }: ListingFormProps) {
  const [formData, setFormData] = useState<Partial<Listing>>(initialData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title?.trim()) newErrors.title = 'Title is required';
    if (!formData.energyType) newErrors.energyType = 'Energy type is required';
    if (!formData.location?.trim()) newErrors.location = 'Location is required';
    if (!formData.totalCapacity || formData.totalCapacity <= 0) 
      newErrors.totalCapacity = 'Valid total capacity is required';
    if (!formData.pricePerUnit || formData.pricePerUnit <= 0)
      newErrors.pricePerUnit = 'Valid price per unit is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Basic Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Title
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white"
              placeholder="Enter listing title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-400">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Energy Type
            </label>
            <select
              value={formData.energyType || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                energyType: e.target.value as EnergyType 
              })}
              className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white"
            >
              <option value="">Select Type</option>
              {Object.values(EnergyType).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.energyType && (
              <p className="mt-1 text-sm text-red-400">{errors.energyType}</p>
            )}
          </div>

          {/* Add more fields similarly */}
        </div>

        {/* Location Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Location Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Location
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white"
              placeholder="Enter location"
            />
          </div>

          {/* Add more location fields */}
        </div>

        {/* Energy Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Energy Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Total Capacity (kWh)
              </label>
              <input
                type="number"
                value={formData.totalCapacity || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  totalCapacity: parseFloat(e.target.value) 
                })}
                className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Price per Unit
              </label>
              <input
                type="number"
                value={formData.pricePerUnit || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  pricePerUnit: parseFloat(e.target.value) 
                })}
                className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Listing' : 'Create Listing'}
        </button>
      </div>
    </form>
  );
}