"use client";
import React, { useState } from 'react';

const faqs = [
  {
    question: "¿Cómo es el proceso de diseño y compra?",
    answer: "El proceso es muy sencillo: 1) Eliges un diseño de nuestro catálogo. 2) Nos contactas por WhatsApp indicando la cantidad y ciudad. 3) Te enviamos una simulación digital con los logos de tu equipo y patrocinadores. 4) Una vez aprobado, iniciamos producción."
  },
  {
    question: "¿Tienen cantidad mínima de pedido?",
    answer: "Sí, confeccionamos desde 6 uniformes en adelante. Esto nos permite garantizar la calidad premium y el nivel de detalle que nos caracteriza."
  },
  {
    question: "¿Qué tipo de telas manejan?",
    answer: "Utilizamos telas de alto rendimiento con tecnología antitranspirante (Dry-Fit) que te mantienen seco y cómodo durante el juego. Además, cuentan con protección UV y costuras reforzadas de alta durabilidad."
  },
  {
    question: "¿Cuánto tiempo demora la entrega?",
    answer: "Nuestro tiempo de producción y entrega promedio es de 7 a 15 días hábiles, dependiendo de la cantidad solicitada y la complejidad del diseño personalizado."
  },
  {
    question: "¿Hacen envíos a toda Colombia?",
    answer: "¡Sí! Hacemos envíos 100% seguros a cualquier ciudad o municipio del país."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq-section">
      <div className="faq-container">
        <div className="faq-header">
          <div className="slogan-block">
            <div className="slogan-line"></div>
            <p className="slogan-text" style={{color: 'var(--brand-primary)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase'}}>Resolviendo dudas</p>
            <div className="slogan-line"></div>
          </div>
          <h2 className="faq-title">PREGUNTAS <span className="text-primary">FRECUENTES.</span></h2>
          <p className="faq-subtitle">Todo lo que necesitas saber antes de uniformar a tu equipo.</p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item ${openIndex === index ? 'active' : ''}`}
              onClick={() => toggleFaq(index)}
            >
              <div className="faq-question">
                <h3>{faq.question}</h3>
                <span className="faq-icon">{openIndex === index ? '−' : '+'}</span>
              </div>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .faq-section {
          padding: 8rem 5vw;
          background: #050505;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
        }
        .faq-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .faq-header {
          text-align: center;
          margin-bottom: 4rem;
        }
        .faq-title {
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: 900;
          line-height: 1.1;
          color: #fff;
          margin-bottom: 1rem;
        }
        .faq-subtitle {
          color: rgba(255,255,255,0.6);
          font-size: 1.1rem;
        }
        .slogan-block {
          display: inline-flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .slogan-line {
          width: 30px;
          height: 1px;
          background: var(--brand-primary);
        }
        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .faq-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .faq-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(212, 255, 0, 0.2);
        }
        .faq-item.active {
          border-color: var(--brand-primary);
          background: rgba(212, 255, 0, 0.02);
        }
        .faq-question {
          padding: 1.5rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .faq-question h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }
        .faq-icon {
          font-size: 1.5rem;
          color: var(--brand-primary);
          font-weight: 300;
        }
        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-in-out, padding 0.3s ease-in-out;
          padding: 0 2rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
        }
        .faq-item.active .faq-answer {
          max-height: 200px;
          padding: 0 2rem 1.5rem 2rem;
        }
      `}</style>
    </section>
  );
}
