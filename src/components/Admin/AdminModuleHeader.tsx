import React from 'react';

export function AdminModuleHeader({
  title,
  subtitle,
  icon: Icon
}: {
  title: string;
  subtitle: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-essence-coral/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-essence-coral" />
          </div>
        )}
        <h1 className="font-playfair text-3xl font-bold text-essence-navy">{title}</h1>
      </div>
      <p className="text-gray-500 mt-2">{subtitle}</p>
    </div>
  );
}
