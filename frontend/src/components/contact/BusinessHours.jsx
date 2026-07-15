import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';

export const BusinessHours = () => (
  <Card className="hover:shadow-lg transition-all duration-300">
    <CardHeader>
      <CardTitle className="text-xl">Business Hours</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="flex justify-between border-b border-gray-100 pb-2 hover:bg-blue-50/50 p-2 rounded transition-colors">
          <span className="font-medium text-gray-800">Monday – Friday</span>
          <span className="text-blue-600 font-medium">9:00 AM – 6:00 PM (EST)</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 pb-2 p-2 rounded transition-colors">
          <span className="font-medium text-gray-800">Saturday</span>
          <span className="text-gray-500">Closed</span>
        </div>
        <div className="flex justify-between pb-2 p-2 rounded transition-colors">
          <span className="font-medium text-gray-800">Sunday</span>
          <span className="text-gray-500">Closed</span>
        </div>
      </div>
    </CardContent>
  </Card>
);
