import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SiteLayout from '../components/common/SiteLayout';

function NotFoundPage() {
  return (
    <SiteLayout>
      <main className="not-found-page">
        <p className="eyebrow">404 · THIS WAY, PLEASE</p>
        <h1>This page took<br /><em>a little detour.</em></h1>
        <p>We can’t find the page you’re looking for. Let’s help you find your way back.</p>
        <div><Link className="button button-outline" to="/"><ArrowLeft size={15} /> Go home</Link><Link className="button button-primary" to="/hotels">Explore stays <ArrowRight size={15} /></Link></div>
      </main>
    </SiteLayout>
  );
}

export default NotFoundPage;
