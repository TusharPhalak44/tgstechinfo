import React from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../../components/ui/accordion';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';

export const FAQAccordion = () => (
  <Card className="glass-card">
    <CardHeader>
      <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
    </CardHeader>
    <CardContent>
      <Accordion type="multiple" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>How can I contact support?</AccordionTrigger>
          <AccordionContent>
            You can reach us via the form above, email us at <a href="mailto:support@tgstechinfo.com" className="text-blue-600 hover:underline">support@tgstechinfo.com</a>, or call our hotline.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>What are your business hours?</AccordionTrigger>
          <AccordionContent>Monday – Friday, 9:00 AM – 6:00 PM (EST). We are closed on weekends.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Where is your office located?</AccordionTrigger>
          <AccordionContent>Our headquarters are in San Francisco, CA. See the map above for details.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger>Do you offer partnership opportunities?</AccordionTrigger>
          <AccordionContent>
            Yes! Please fill out the partnership inquiry in the contact form and our team will get back to you.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CardContent>
  </Card>
);
