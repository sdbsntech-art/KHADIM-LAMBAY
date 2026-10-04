import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import NeedsBreakdown from './components/NeedsBreakdown';
import ContributionForm from './components/ContributionForm';
import ReceiptModal from './components/ReceiptModal';
import Footer from './components/Footer';

export default function App() {
  const [contribution, setContribution] = useState(null);

  const handleContribution = (data) => {
    setContribution(data);
    window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="site-shell">
      <Header onDonateClick={() => document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' })} />
      <main>
        <Hero onDonateClick={() => document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' })} />
        <NeedsBreakdown />
        <ContributionForm onSubmitContribution={handleContribution} />
      </main>
      <Footer />
      {contribution && <ReceiptModal data={contribution} onClose={() => setContribution(null)} />}
    </div>
  );
}
