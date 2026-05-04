'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const testimonials = [
  {
    id: 1,
    name: 'Marc D., électricien sous-traitant',
    role: 'Micro-entrepreneur • Lyon',
    avatar: '/next.svg',
    quote: 'Sur 30 dépôts Chorus Pro le mois dernier, zéro rejet. Avant InvoiceOps, c\'était 1 sur 3 qui repartait pour TVA mal encodée — je perdais des journées à recommencer.',
    metrics: '0 rejet Chorus Pro sur 30 dépôts',
  },
  {
    id: 2,
    name: 'Sylvie R., maçon',
    role: 'Adhérente FFBâtiment 44 • SARL',
    avatar: '/next.svg',
    quote: 'Les factures de situation étaient un cauchemar. InvoiceOps cumule l\'avancement et calcule la retenue de garantie 5% automatiquement. Mes 3 chantiers en cours sont au carré.',
    metrics: '3 chantiers gérés sans erreur de cumul',
  },
  {
    id: 3,
    name: 'Karim B., plombier-chauffagiste',
    role: 'Adhérent CAPEB 13 • Auto-entrepreneur',
    avatar: '/next.svg',
    quote: 'Mon comptable validait mes factures Chorus Pro avant. Maintenant InvoiceOps les valide en amont — code AE, mention légale, SIRET donneur d\'ordre. J\'ai économisé 200€/mois en relectures.',
    metrics: '200€/mois économisés en honoraires',
  },
  {
    id: 4,
    name: 'Antoine L., couvreur',
    role: 'Sous-traitant BTP • Bordeaux',
    avatar: '/next.svg',
    quote: 'Le code AE pour autoliquidation, l\'article 283-2 nonies du CGI — tout est rempli sans que j\'y pense. Je signe la situation, je dépose, le donneur d\'ordre l\'accepte.',
    metrics: 'Factur-X conforme dès la 1re soumission',
  },
];

export default function TestimonialSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000); // Change testimonial every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="splitfact-section main-container text-center"
    >
      <div className="text-center mb-lg">
        <span className="badge bg-validationGreen text-white px-xl py-md rounded-pill mb-lg" style={{fontSize: '16px'}}>
          Témoignages d'artisans BTP
        </span>
      </div>
      <h2 className="display-4 fw-semibold mb-lg text-darkGray">Ils déposent sans rejet sur Chorus Pro</h2>
      <p className="lead text-mediumGray mb-xxl">Pourquoi les sous-traitants BTP basculent vers une facturation conforme dès la première soumission</p>
      <div className="position-relative" style={{ minHeight: '250px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="d-flex flex-column align-items-center"
          >
            <Image
              src={testimonials[currentIndex].avatar}
              alt={testimonials[currentIndex].name}
              width={80}
              height={80}
              className="rounded-circle mb-lg"
              style={{ objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <h5 className="fw-bold mb-sm text-darkGray">{testimonials[currentIndex].name}</h5>
            <p className="text-mediumGray mb-lg" style={{ fontSize: '14px' }}>{testimonials[currentIndex].role}</p>
            <blockquote className="text-darkGray mb-lg h5 fw-normal" style={{ maxWidth: '800px', lineHeight: '1.6' }}>
              "{testimonials[currentIndex].quote}"
            </blockquote>
            <div className="bg-success-light text-success-dark px-lg py-md rounded-pill d-inline-block">
              <small className="fw-bold">
                <i className="bi bi-graph-up-arrow me-2"></i>
                {testimonials[currentIndex].metrics}
              </small>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="d-flex justify-content-center mt-xl">
        {testimonials.map((_, index) => (
          <span
            key={index}
            className={`dot mx-2 ${currentIndex === index ? 'active' : ''}`}
            onClick={() => handleDotClick(index)}
            style={{
              height: '10px',
              width: '10px',
              backgroundColor: currentIndex === index ? 'var(--primary-blue)' : 'var(--light-gray)',
              borderRadius: '50%',
              display: 'inline-block',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
            }}
          ></span>
        ))}
      </div>
      <div className="mt-xxl">
        <div className="row g-lg text-center">
          <div className="col-md-3">
            <div className="border-0 p-md">
              <h4 className="text-primary fw-bold mb-sm">€125k</h4>
              <small className="text-mediumGray">Red. URSSAF évités</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="border-0 p-md">
              <h4 className="text-validationGreen fw-bold mb-sm">847h</h4>
              <small className="text-mediumGray">Temps économisé</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="border-0 p-md">
              <h4 className="text-optionalAccent fw-bold mb-sm">96%</h4>
              <small className="text-mediumGray">Satisfaction</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="border-0 p-md">
              <h4 className="text-primary fw-bold mb-sm">52</h4>
              <small className="text-mediumGray">Collectifs actifs</small>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}