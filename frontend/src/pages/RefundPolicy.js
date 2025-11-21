import React from 'react';
import CloneFooter from '../components/CloneFooter';

const RefundPolicy = () => {
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
            Refund Policy
          </h1>

          {/* Introduction */}
          <div className="mb-6">
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              At Novva RasayanaBio LLP, we strive to provide high-quality herbal products to our customers. We understand that sometimes you may need to return a product, and we want to make that process as simple as possible. Please read our refund and returns policy below for more information.
            </p>
          </div>

          {/* Refund Policy */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              Refund Policy:
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              Unfortunately, we do not offer refunds for our products. All sales are final, and we cannot accept returns or exchanges. We apologize for any inconvenience this may cause.
            </p>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              Incase if the refund is approved, the refund will be processed in the original mode of payment within 7 to 14 working days.
            </p>
          </div>

          {/* Returns Policy */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              Returns Policy:
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              We do not accept returns or exchanges for any of our products. However, if you receive a damaged or defective product, please email us at support@rasayanabio.com within 48 hours of receiving your order. Please include your order number and a photo of the damaged or defective product in your email. We will review your request and may offer a replacement or store credit at our discretion.
            </p>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              After processing the return, the refund will be processed in the original mode of payment within 7 to 14 working days.
            </p>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              For questions or assistance, contact support@rasayanabio.com. Availability is Monday through Saturday, 9:00 am to 6:00 pm IST.
            </p>
          </div>

          {/* Thank You Message */}
          <div className="mb-6">
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              Thank you for choosing Novva RasayanaBio LLP for your herbal needs. We appreciate your business and strive to provide the best customer service possible.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <CloneFooter />
    </div>
  );
};

export default RefundPolicy;

