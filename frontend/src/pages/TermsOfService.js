import React from 'react';
import CloneFooter from '../components/CloneFooter';

const TermsOfService = () => {
  const headingColor = '#1c5f2a';
  const bodyColor = '#2f2f2f';
  const bodyFontSize = '15px';
  const bodyLineHeight = '1.6';

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#1f2937' }}>
            Terms Of Service
          </h1>

          {/* Introduction */}
          <div className="mb-6">
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              Welcome to Novva RasayanaBio LLP! Your use of our website and any goods, services, and material provided by Novva RasayanaBio LLP are defined by these terms of service (the "Terms"). You accept these Terms by seeing our website or purchasing our products. Please do not use our website or buy our products if you disagree with these terms.
            </p>
          </div>

          {/* Utilizing this website */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              Utilizing this website:
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              Our website is only intended for personal, non-commercial use.
            </p>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              Our website may not be used for any unauthorized or illegal reasons. By using our website, you agree to abide by all applicable laws and regulations.
            </p>
          </div>

          {/* Intellectual property */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              Intellectual property:
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              Copyright laws protect every data on our website, including text, graphics, logos, images, and software, which belongs to Novva RasayanaBio LLP. Without our prior written consent, you are not allowed to use, reproduce, modify, or distribute any content on our website.
            </p>
          </div>

          {/* Features of the Product */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              Features of the Product:
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              We work hard to guarantee that all information on our website is accurate and current. Nevertheless, we disclaim all liability for the completeness or accuracy of any information on our website, including availability, rates, and product descriptions.
            </p>
          </div>

          {/* modifications */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              modifications:
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              These Terms may be subject to change at any time, with our reserve. Any changes will be announced on our website, and by using our products or site going forward, you accept to the updated Terms.
            </p>
          </div>

          {/* Governing Law */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              Governing Law:
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              The laws of India shall apply to the interpretation and application of these Terms.
            </p>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              Please email support@rasayanabio.com with any queries or worries you may have about these Terms. We appreciate you selecting Novva RasayanaBio LLP for your herbal requirements!
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <CloneFooter />
    </div>
  );
};

export default TermsOfService;

