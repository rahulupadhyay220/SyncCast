import React from 'react';
import { HomePage } from '../pages/HomePage';

// Redirects or delegates to the dedicated HomePage experience
export function LandingPage(props) {
  return <HomePage {...props} />;
}

export default LandingPage;
