import Header from './components/Header';
import Hero from './components/Hero';
import NeedsBreakdown from './components/NeedsBreakdown';
import ContributionForm from './components/ContributionForm';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="site-shell">
      <Header onDonateClick={() => document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' })} />
      <main>
        <Hero onDonateClick={() => document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' })} />
        <NeedsBreakdown />
        <ContributionForm />
      </main>
      <Footer />
    </div>
  );
}
