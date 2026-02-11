import React from 'react';

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="w-full bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
            <div className="h-16 bg-gray-50 border-b border-gray-100 flex items-center px-6">
                <div className="h-6 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="p-4 space-y-4">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                        <div className="h-12 w-12 rounded-full bg-gray-100"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/3 bg-gray-100 rounded"></div>
                            <div className="h-3 w-1/4 bg-gray-50 rounded"></div>
                        </div>
                        <div className="h-8 w-24 bg-gray-100 rounded-lg"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
