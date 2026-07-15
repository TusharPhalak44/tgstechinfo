import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

// SocialNewsletter – a premium styled newsletter subscription card
export const SocialNewsletter = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you'd call an API here
    console.log('Newsletter subscription:', email);
    setSubmitted(true);
  };

  return (
    <Card className="glass-card transition-shadow hover:shadow-xl max-w-md mx-auto my-8">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-center">
          Stay Updated 📬
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {submitted ? (
          <p className="text-green-500 text-center">✅ Thanks for subscribing!</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/30 backdrop-blur-sm border border-white/50 text-black placeholder-gray-600"
            />
            <Button
              type="submit"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all"
            >
              Subscribe
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};
