import React from 'react';
import CloneFooter from '../components/CloneFooter';

const PrivacyPolicy = () => {
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
            Privacy Policy
          </h1>

          {/* Introduction */}
          <div className="mb-6">
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              The information you provide to Novva RasayanaBio LLP when using this website is used and protected according to with this privacy statement.
            </p>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              We at Novva RasayanaBio LLP are dedicated to protecting your privacy. You may be certain that any information we request from you on this website that allows us to identify you will only be used in compliance with our privacy statement.
            </p>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              By updating this website, Novva RasayanaBio LLP reserves the right to modify this policy at any time. Periodically check this page to make sure any modifications have not been made against your preferences.
            </p>
          </div>

          {/* We might get the following data */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              We might get the following data:
            </h2>
            <ul className="list-disc list-inside space-y-2 mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              <li>Name and position title</li>
              <li>Email address and other contact details</li>
              <li>Details about a person's preferences, interests, and postcode</li>
              <li>Additional details pertaining to client surveys and/or offers</li>
            </ul>
          </div>

          {/* What we do with the data that we collect */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              What we do with the data that we collect
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              In order to better understand your needs and serve you, we need this information, especially for the following reasons:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              <li>internal documentation.</li>
              <li>We might make use of the data to enhance our offerings.</li>
              <li>Using the email address you have supplied, we may occasionally send you promotional emails about new goods, exclusive deals, or other information we think you would find interesting.</li>
            </ul>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              We could occasionally use your information to get in touch with you for market research. We may get in touch with you via mail, fax, phone, or email. We might utilize the data to tailor the website to your preferences.
            </p>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              We are committed to ensuring that your information is secure. In order to prevent unauthorized access or disclosure, we have put in suitable measures.
            </p>
          </div>

          {/* How cookies are used */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              How cookies are used
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              A cookie is a little file that requests authorization to be stored on the hard disk of your computer. Once you accept, the file is added, and the cookie informs you when you visit a specific website or assists in the analysis of web traffic. Cookies enable personalized responses from web apps. By collecting and storing information about your preferences, the web application can adjust its functionality to suit your requirements, interests, and dislikes.
            </p>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              Cookies from traffic logs are utilized by us to determine which pages are being used. This aids in the analysis of website traffic statistics and helps us make improvements to our website to better meet the needs of users.
            </p>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              In general, cookies enable us to track which pages you find useful and which you do not, which helps us provide you with a better experience on our website. Other than the information you choose to share with us, a cookie does not allow us access to your computer or any information about you.
            </p>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              You can accept or reject cookies if you'd like. You might not be able to use the website to its full potential as a result.
            </p>
          </div>

          {/* Managing your personal data */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ color: headingColor }}>
              Managing your personal data
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              When filling out a form on a website, look for the option to check the box indicating that you do not want the information used for direct marketing by anyone.
            </p>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              You can always opt out of our utilizing your personal information for direct marketing if you have already consented to it by sending an email or letter to support@rasayanabio.com.
            </p>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              Unless we obtain your consent or are compelled by law to do so, we will not sell, transfer, or lease your personal information to outside parties. If you indicate that you would like this to happen, we may use your personal information to send you promotional materials about other companies that we believe you might find interesting.
            </p>
            <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
              If you think that any of the information we have about you is inaccurate or lacking, please contact us as soon as possible by email at support@rasayanabio.com. If any information is proven to be inaccurate, we will update it right away.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <CloneFooter />
    </div>
  );
};

export default PrivacyPolicy;

