import React from 'react';
import CloneFooter from '../components/CloneFooter';

const ShippingPolicy = () => {
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
            Shipping Policy
          </h1>

          {/* Introduction */}
          <div className="mb-6">
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              We at Novva RasayanaBio LLP know how crucial it is for you to get your orders quickly and effectively. To give you all the information you need to know about shipping and delivery, we have included our shipping policy below.
            </p>
          </div>

          {/* Time Spent Processing */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              Time Spent Processing:
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              Orders are processed and mailed in two to three business days after confirmation. Orders placed on weekends or holidays will be processed on the following business day.
            </p>
          </div>

          {/* Delivery Procedures */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              Delivery Procedures:
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              Standard shipping is available via courier partners. For deliveries within India, regular shipping is expected to arrive between 4-7 business days.
            </p>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              We offer shipping inside India.
            </p>
          </div>

          {/* Shipping Charges */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              Shipping Charges:
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              Shipping cost is determined by the package's weight and shipment address, and will be shown at checkout.
            </p>
          </div>

          {/* Order Monitoring */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              Order Monitoring:
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              You will receive an email with tracking details. You can also follow your order by visiting the website's order track page and logging into your account.
            </p>
          </div>

          {/* Problems with Delivery */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              Problems with Delivery:
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              If your order doesn't arrive within the anticipated delivery window, please reach out to us at support@rasayanabio.com. We collaborate with our courier partners to fix delivery problems.
            </p>
          </div>

          {/* Shipping to Other Countries */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              Shipping to Other Countries:
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              We do not currently provide international shipping. Shipping is only offered inside India.
            </p>
          </div>

          {/* Details of Contact */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              Details of Contact:
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              Please email us at support@rasayanabio.com if you have any questions or complaints about our shipping policy.
            </p>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              At Novva RasayanaBio LLP, we are committed to fulfilling your herbal requirements and delivering high-caliber customer care.
            </p>
          </div>

          {/* Returns and Refunds */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              Returns and Refunds:
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              We offer independent policies on our website for refunds and returns. You agree to our refund and return policy by buying our products.
            </p>
          </div>

          {/* Restrictions on Liability */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              Restrictions on Liability:
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              When using our website or our products, Novva RasayanaBio LLP takes no responsibility for any direct, indirect, incidental, special, or consequential damages. Our entire responsibility will never be greater than the price you paid for the good or service.
            </p>
          </div>

          {/* Compensation */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              Compensation:
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              By using our website or products, you agree to indemnify and hold Novva RasayanaBio LLP harmless against any claims, losses, damages, obligations, and expenses (including legal fees).
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <CloneFooter />
    </div>
  );
};

export default ShippingPolicy;

