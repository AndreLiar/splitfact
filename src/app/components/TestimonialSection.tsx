'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const testimonials = [
  {
    id: 1,
    name: 'Nicolas Dubois, Fondateur chez TechCollective',
    role: 'Développeur Full-Stack • Micro-BNC',
    avatar: '/next.svg',
    quote: 'Avant Splitfact, on passait 2 jours par mois sur la compta. Maintenant, tout est automatisé. L\'IA génère nos déclarations URSSAF en 5 minutes. On a économisé 15h/mois !',
    metrics: '+2400€ économisés en expertise comptable',
  },
  {
    id: 2,
    name: 'Sarah Martin, Co-founder CreativeStudio',
    role: 'Designer UX/UI • Micro-BIC',
    avatar: '/next.svg',
    quote: 'Le vrai game-changer c\'est la conformité URSSAF automatique. On a évité un redressement de 12k€ grâce aux sous-factures générées automatiquement. Inestimable !',
    metrics: '12k€ de redressement évité',
  },
  {
    id: 3,
    name: 'Alexandre Leroy, Leader DevSquad',
    role: 'Développeur Senior • SASU',
    avatar: '/next.svg',
    quote: 'Plus jamais de disputes sur les répartitions ! Splitfact calcule tout automatiquement et chacun reçoit sa part directement. Nos clients adorent recevoir une seule facture propre.',
    metrics: '5h économisées par projet',
  },
  {
    id: 4,
    name: 'Marie Rousseau, Consultante Marketing',
    role: 'Growth Hacker • Auto-entrepreneur',
    avatar: '/next.svg',
    quote: 'L\'assistant IA répond à toutes mes questions fiscales en français simple. Plus besoin d\'expert-comptable pour les questions basiques. Un véritable assistant fiscal personnel !',
    metrics: '180€/mois d\'expertise comptable économisés',
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
          🎆 Témoignages réels
        </span>
      </div>
      <h2 className="display-4 fw-semibold mb-lg text-darkGray">Ils économisent des milliers d'euros</h2>
      <p className="lead text-mediumGray mb-xxl">Découvrez comment nos utilisateurs transforment leur facturation</p>
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
            <img
              src={testimonials[currentIndex].avatar}
              alt={testimonials[currentIndex].name}
              className="rounded-circle mb-lg"
              style={{ width: '80px', height: '80px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
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