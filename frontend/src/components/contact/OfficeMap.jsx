import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';

export const OfficeMap = () => (
  <Card className="glass-card transition-shadow hover:shadow-lg">
    <CardHeader>
      <CardTitle className="text-xl">Our Office Location</CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.019896102983!2d-122.40159328468286!3d37.78799497975678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80858064c5e0d5e5%3A0xf0a0b6dd5c6a4b0!2sSalesforce%20Tower!5e0!3m2!1sen!2sus!4v1691045678901!5m2!1sen!2sus"
        width="100%"
        height="300"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </CardContent>
  </Card>
);
