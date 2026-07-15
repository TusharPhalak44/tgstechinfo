import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { FaTwitter, FaLinkedin, FaGithub, FaFacebook } from 'react-icons/fa';

const socialLinks = [
  { href: 'https://twitter.com/tgstechinfo', icon: <FaTwitter size={24} />, label: 'Twitter' },
  { href: 'https://linkedin.com/company/tgstechinfo', icon: <FaLinkedin size={24} />, label: 'LinkedIn' },
  { href: 'https://github.com/tgstechinfo', icon: <FaGithub size={24} />, label: 'GitHub' },
  { href: 'https://facebook.com/tgstechinfo', icon: <FaFacebook size={24} />, label: 'Facebook' },
];

export const SocialMediaIcons = () => (
  <TooltipProvider>
    <div className="flex space-x-4 justify-center">
      {socialLinks.map(({ href, icon, label }) => (
        <Tooltip key={href}>
          <TooltipTrigger asChild>
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600 transition-colors">
              {icon}
            </a>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  </TooltipProvider>
);
