// Advanced Filters Component for Admin Dashboard
import React, { useState } from 'react';

export interface FilterConfig {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'number' | 'numberRange' | 'multiSelect';
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface FilterValues {
  [key: string]: any;
}

interface AdvancedFiltersProps {
  filters: FilterConfig[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onReset: () => void;
  isOpen: boolean;
  onToggle: () => void;
  activeFiltersCount?: number;
}

export default function AdvancedFilters({
  filters,
  values,
  onChange,
  onReset,
  isOpen,
  onToggle,
  activeFiltersCount = 0
}: AdvancedFiltersProps) {
  
  const handleChange = (filterId: string, value: any) => {
    onChange({ ...values, [filterId]: value });
  };

  const handleRangeChange = (filterId: string, field: 'from' | 'to', value: any) => {
    const currentRange = values[filterId] || {};
    onChange({ 
      ...values, 
      [filterId]: { ...currentRange, [field]: value } 
    });
  };

  const handleMultiSelectChange = (filterId: string, option: string) => {
    const currentValues = values[filterId] || [];
    const newValues = currentValues.includes(option)
      ? currentValues.filter((v: string) => v !== option)
      : [...currentValues, option];
    onChange({ ...values, [filterId]: newValues });
  };

  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'text':
        return (
          <input
            type="text"
            value={values[filter.id] || ''}
            onChange={(e) => handleChange(filter.id, e.target.value)}
            placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}`}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none"
          />
        );

      case 'select':
        return (
          <select
            value={values[filter.id] || ''}
            onChange={(e) => handleChange(filter.id, e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none"
          >
            <option value="">All {filter.label}</option>
            {filter.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={values[filter.id] || ''}
            onChange={(e) => handleChange(filter.id, e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none"
          />
        );

      case 'dateRange':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">From</label>
              <input
                type="date"
                value={values[filter.id]?.from || ''}
                onChange={(e) => handleRangeChange(filter.id, 'from', e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">To</label>
              <input
                type="date"
                value={values[filter.id]?.to || ''}
                onChange={(e) => handleRangeChange(filter.id, 'to', e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none"
              />
            </div>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={values[filter.id] || ''}
            onChange={(e) => handleChange(filter.id, e.target.value)}
            placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}`}
            min={filter.min}
            max={filter.max}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none"
          />
        );

      case 'numberRange':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Min</label>
              <input
                type="number"
                value={values[filter.id]?.from || ''}
                onChange={(e) => handleRangeChange(filter.id, 'from', e.target.value)}
                placeholder="Min"
                min={filter.min}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max</label>
              <input
                type="number"
                value={values[filter.id]?.to || ''}
                onChange={(e) => handleRangeChange(filter.id, 'to', e.target.value)}
                placeholder="Max"
                max={filter.max}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1a558b] focus:border-[#1a558b] outline-none"
              />
            </div>
          </div>
        );

      case 'multiSelect':
        return (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filter.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={(values[filter.id] || []).includes(opt.value)}
                  onChange={() => handleMultiSelectChange(filter.id, opt.value)}
                  className="w-4 h-4 text-[#1a558b] border-gray-300 rounded focus:ring-[#1a558b]"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mb-4">
      {/* Filter Toggle Button */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
          isOpen
            ? 'bg-[#1a558b] text-white'
            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#1a558b] hover:text-[#1a558b]'
        }`}
      >
        <span className="material-symbols-outlined text-lg">
          {isOpen ? 'filter_list_off' : 'filter_list'}
        </span>
        <span>{isOpen ? 'Hide Filters' : 'Advanced Filters'}</span>
        {activeFiltersCount > 0 && (
          <span className="bg-green-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="mt-4 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1a558b]">tune</span>
              Filter Options
            </h3>
            <button
              onClick={onReset}
              className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">restart_alt</span>
              Reset All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.id} className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  {filter.label}
                </label>
                {renderFilter(filter)}
              </div>
            ))}
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                <span className="font-bold">{activeFiltersCount}</span> filter{activeFiltersCount !== 1 ? 's' : ''} active
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
