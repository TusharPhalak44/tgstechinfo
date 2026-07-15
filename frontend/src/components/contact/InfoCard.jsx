import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';

export const InfoCard = ({ icon, title, children, className = '' }) => (
  <Card className={`card glass-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${className}`}>
    <CardHeader className="flex flex-row items-center space-x-4 pb-2">
      {icon}
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);
