import { useEffect } from 'react';

interface StructuredDataProps {
  type: 'Organization' | 'WebSite' | 'WebPage' | 'FAQPage' | 'Product' | 'Service';
  data: Record<string, any>;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    const scriptId = `structured-data-${type.toLowerCase()}`;
    
    // Remove existing script if present
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    // Create new script element
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': type,
      ...data
    });

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [type, data]);

  return null;
}

// Pre-built structured data components
export function OrganizationSchema() {
  return (
    <StructuredData
      type="Organization"
      data={{
        name: 'Plus1 Rewards',
        alternateName: '+1 Rewards',
        url: 'https://plus1rewards.com',
        logo: 'https://plus1rewards.com/logo.png',
        description: 'Healthcare funding platform that enables members to earn cashback toward medical cover plans through shopping at partner stores in South Africa.',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'ZA',
          addressLocality: 'South Africa'
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Service',
          availableLanguage: ['English', 'Afrikaans']
        },
        sameAs: [
          'https://plus1rewards.com'
        ],
        areaServed: {
          '@type': 'Country',
          name: 'South Africa'
        }
      }}
    />
  );
}

export function WebSiteSchema() {
  return (
    <StructuredData
      type="WebSite"
      data={{
        name: 'Plus1 Rewards',
        url: 'https://plus1rewards.com',
        description: 'Shop at partner stores and earn real cashback that funds your medical cover. Plus1 Rewards makes healthcare accessible for everyone in South Africa.',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://plus1rewards.com/find-partner?q={search_term_string}'
          },
          'query-input': 'required name=search_term_string'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Plus1 Rewards',
          logo: {
            '@type': 'ImageObject',
            url: 'https://plus1rewards.com/logo.png'
          }
        }
      }}
    />
  );
}

export function ServiceSchema() {
  return (
    <StructuredData
      type="Service"
      data={{
        name: 'Plus1 Rewards Cashback Healthcare Funding',
        serviceType: 'Healthcare Funding Platform',
        provider: {
          '@type': 'Organization',
          name: 'Plus1 Rewards'
        },
        areaServed: {
          '@type': 'Country',
          name: 'South Africa'
        },
        description: 'Earn cashback on purchases at partner stores that automatically funds your medical cover plan. Choose from Day to Day, Hospital, or Comprehensive cover options.',
        offers: {
          '@type': 'Offer',
          availability: 'https://schema.org/InStock',
          priceCurrency: 'ZAR',
          price: '390',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '390',
            priceCurrency: 'ZAR',
            unitText: 'per month'
          }
        },
        category: 'Healthcare Funding',
        audience: {
          '@type': 'Audience',
          audienceType: 'South African Residents',
          geographicArea: {
            '@type': 'Country',
            name: 'South Africa'
          }
        }
      }}
    />
  );
}

export function FAQSchema({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  return (
    <StructuredData
      type="FAQPage"
      data={{
        mainEntity: faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer
          }
        }))
      }}
    />
  );
}
