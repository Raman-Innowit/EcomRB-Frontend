import React from 'react';
import { Link } from 'react-router-dom';
import CloneFooter from '../components/CloneFooter';

const DiabetesArticle = () => {
  const headingColor = '#1c5f2a';
  const bodyColor = '#2f2f2f';
  const bodyFontSize = '17px';
  const bodyLineHeight = '1.85';

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content Area - Left Side */}
          <main className="lg:w-3/4 order-2 lg:order-1">
            {/* Tags */}
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#22c55e', color: '#fff' }}>
                diabetes
              </span>
              <span className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#f59e0b', color: '#fff' }}>
                health
              </span>
              <span className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#84cc16', color: '#fff' }}>
                healthy
              </span>
            </div>

            {/* Feature Image */}
            <div className="mt-4 mb-8">
              <img
                src="/assets/diabetes-article.png"
                alt="Early Detection of Diabetes"
                className="w-full h-auto rounded-lg"
                style={{ maxHeight: '600px', objectFit: 'cover' }}
              />
            </div>

            {/* Article Metadata */}
            <div className="mb-6 flex items-center justify-between text-gray-600" style={{ fontSize: bodyFontSize }}>
              <div>
                <span>October 9, 2024</span>
                <span className="mx-2">•</span>
                <span>By Dr Monisha Singhal</span>
              </div>
              <div>0 comments</div>
            </div>

            {/* Article Title */}
            <h1
              className="text-4xl md:text-5xl font-bold mb-8 leading-tight"
              style={{ color: '#1f2937', fontFamily: 'Georgia, serif' }}
            >
              Stay Healthy, Stay Informed: Early Detection of Diabetes and Preventive Strategies
            </h1>

            {/* Introduction Section */}
            <div className="mb-10">
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Uncontrolled diabetes is a serious condition and the worst is being unaware of one's Diabetes!
              </p>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Even in today's world, diabetes is one of the most rapidly rising health problems worldwide affecting millions. The frightening part is that about half of the population having diabetes is diagnosed so late that people only find out they have the disease once they present complications. We all know diabetes is a chronic condition — but a quick diagnosis can help patients manage the disease and avoid dire health implications.
              </p>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                In this blog, we'll explore the importance of recognizing early symptoms, understanding key risk factors like family history and lifestyle, and so on.
              </p>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Let's learn about diabetes:
              </p>
            </div>

            {/* What is Diabetes Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: headingColor }}>
                What is Diabetes?
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Diabetes is a long-term health condition that affects how your body turns food into energy. The pancreas makes a hormone—insulin—that helps the body use sugar (glucose) from food to enter cells where it can be used for energy. This is when the body either does not make enough insulin or cannot use it properly, leaving glucose in the blood and resulting in high levels of sugar.
              </p>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                It is an autoimmune disease characterized by the destruction of insulin-producing cells in the pancreas. While children and young adults are often diagnosed, this form can occur at any age.
              </p>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Some diabetic patients don't seek medical attention, and the implications of not identifying and treating the disease promptly can lead to complications from diabetic retinopathy hence, why it is necessary to identify these risk factors and implement modern preventive strategies.
              </p>
            </div>

            {/* Common Signs of Undetected Diabetes Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: headingColor }}>
                Common Signs of Undetected Diabetes
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Many individuals are often unaware of their condition, with mild or no symptoms. However, if you notice certain signs, it's important to get tested.
              </p>

              {/* Fatigue Section */}
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: headingColor }}>
                  Fatigue
                </h3>
                <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                  A person can get too tired even when engaged in very light activities like short walks, and such unexplained weariness in the body is often one of the initial concerns of diabetes about the interactions of diabetes and tissues. It is typical in such cases for the body to seek intermittent starvation, resulting from a decreased use of glucose, in order to feed off fat instead.
                </p>
              </div>

              {/* Family History Section */}
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: headingColor }}>
                  Family History of Diabetes
                </h3>
                <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                  If you are the child or sibling of a diabetic patient, your chance of contracting the condition is quite high. A family history of diabetes can be said to be one of the important reasons for which you should regularly monitor your blood sugar levels, more so if you have any other complaints at the same time.
                </p>
              </div>

              {/* Frequent Urination Section */}
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: headingColor }}>
                  Frequent Urination
                </h3>
                <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                  The excess sugar in your blood leads to excess fluid intake to remove the sugar from concentrations in the blood. Therefore, you may notice that you are going to the restroom to pass urine every short while, even at night.
                </p>
              </div>

              {/* Increased Thirst Section */}
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: headingColor }}>
                  Increased Thirst
                </h3>
                <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                  Excessive voiding of urine can lead to a lost thirst stimulus hence making one's thirst wanting. However, if you answer yes to this question, even when increasing fluids, you still feel thirsty; you may have elevated blood sugars.
                </p>
              </div>

              {/* Other Symptoms Section */}
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: headingColor }}>
                  Other Symptoms to check
                </h3>
                <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                  Even outside those common symptoms, other associated ones sometimes confound the diagnosis of diabetes. Here is a list of:
                </p>

                {/* Unexplained Weight Loss */}
                <div className="mb-6">
                  <h4 className="text-lg md:text-xl font-bold mb-3" style={{ color: headingColor }}>
                    Unexplained Weight Loss:
                  </h4>
                  <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                    Despite normal food intake many people complain of weight loss because of the need for energy in the muscles and fat combustion on account of low insulin levels.
                  </p>
                </div>

                {/* Blurred Vision */}
                <div className="mb-6">
                  <h4 className="text-lg md:text-xl font-bold mb-3" style={{ color: headingColor }}>
                    Blurred Vision:
                  </h4>
                  <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                    Due to excess sugar in the blood, damage may occur to the blood vessels that affect the eyes, leading to vision problems that may be temporary or permanent.
                  </p>
                </div>

                {/* On-going Wounds */}
                <div className="mb-6">
                  <h4 className="text-lg md:text-xl font-bold mb-3" style={{ color: headingColor }}>
                    On-going Wounds:
                  </h4>
                  <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                    Diabetes also causes weak blood circulation and weak immune systems which also contributes to slow healing of any cut or sore.
                  </p>
                </div>

                {/* Tingling or Numbness */}
                <div className="mb-6">
                  <h4 className="text-lg md:text-xl font-bold mb-3" style={{ color: headingColor }}>
                    Tingling or Numbness:
                  </h4>
                  <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                    Victims of diabetes are likely to suffer from neurological complications in most cases on their more distal regions encompassing hands or feet. This may present itself as a burning sensation, loss of sensation, or even discomfort.
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Factors for Diabetes Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: headingColor }}>
                Risk Factors for Diabetes
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Besides the symptoms presented, other risk factors in particular can augment the chances of having diabetes. Being aware of such factors would enable you to manage your health more effectively.
              </p>

              {/* Age */}
              <div className="mb-6">
                <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: headingColor }}>
                  Age
                </h3>
                <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                  The chances of having type 2 diabetes increase gradually as one advances in age, especially after one hits 45 years.
                </p>
              </div>

              {/* Weight */}
              <div className="mb-6">
                <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: headingColor }}>
                  Weight
                </h3>
                <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                  Weight gain as well as obesity are regarded as the most significant risk factors for being diagnosed with type 2 diabetes.
                </p>
              </div>

              {/* Sedentary Lifestyle */}
              <div className="mb-6">
                <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: headingColor }}>
                  Sedentary Lifestyle
                </h3>
                <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                  Lack of exercise can result in gaining excess weight coupled with increased insulin resistance which raises the susceptibility to diabetes.
                </p>
              </div>

              {/* Diet */}
              <div className="mb-6">
                <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: headingColor }}>
                  Diet
                </h3>
                <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                  Eating a lot of refined foods, sugar, and bad fats will make one obese and have metabolic complications.
                </p>
              </div>

              {/* Ethnicity */}
              <div className="mb-6">
                <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: headingColor }}>
                  Ethnicity
                </h3>
                <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                  It has been recognized that some ethnic groups are more susceptible to diabetes primarily including but not limited to African Americans, Hispanic/Latino Americans, Native Americans, and even Asian Americans.
                </p>
              </div>
            </div>

            {/* Taking Action: Early Testing and Diagnosis Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: headingColor }}>
                Taking Action: Early Testing and Diagnosis
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                If your risk of diabetes is high, or you have any of the symptoms mentioned above, it is important to be examined.
              </p>

              <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Different forms of blood tests for diagnosis:
              </p>

              <ul className="space-y-4 mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                <li>
                  <strong className="text-gray-800">Fasting Plasma Glucose Test (FPG)</strong> - Assesses the level of blood sugar taken in at least 8 hours of fasting.
                </li>
                <li>
                  <strong className="text-gray-800">A1C Test</strong> - Evaluates a person's A1C in terms of blood glucose levels over two to three months even in diabetics.
                </li>
                <li>
                  <strong className="text-gray-800">Oral Glucose Tolerance Test (OGTT)</strong> - Measures the blood sugar concentration before and after glucose ingestion and assesses how the body handles glucose.
                </li>
              </ul>

              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Early testing is especially very important when one has a family background or risk factors of being diabetic as the condition is caught at initial stages and managed well.
              </p>
            </div>

            {/* Diabetes Management Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: headingColor }}>
                Diabetes Management: Lifestyle and Pharmacological Strategies
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                After diagnosis, it is important to manage diabetes by adopting some changes in life and accepting medical treatment since both work better than one alone. Here are remedies to manage diabetes and impede its aggressive progression.
              </p>

              {/* Dietary practices */}
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: headingColor }}>
                  Dietary practices and nutrition management
                </h3>
                <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                  Creative management of diabetes is finding a way of eating well-balanced nutritious meals. In this case:
                </p>
                <ul className="space-y-3 mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                  <li><strong className="text-gray-800">Whole Grains:</strong> Replace sculpture grains with whole grains such as brown rice, quinoa, and whole wheat.</li>
                  <li><strong className="text-gray-800">Healthy Fats:</strong> Avoid saturated fats and shift to unsaturated fats like those found in olive oil, avocados, and nuts.</li>
                  <li><strong className="text-gray-800">Lean Proteins:</strong> Cut back on meat and begin learning sources of protein such source fish chicken beans legumes.</li>
                  <li><strong className="text-gray-800">Fiber:</strong> Blood sugar levels are controlled by eating high fiber content foods such as vegetables fruits and legumes.</li>
                </ul>
                <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                  Avoid foods high in sugar, unhealthy fats, and processed carbohydrates, which can cause blood sugar spikes.
                </p>
              </div>

              {/* Regular Exercise */}
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: headingColor }}>
                  Regular Exercise
                </h3>
                <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                  Bodily movements help in bringing down the glucose levels and thus give the body more insulin. Do moderate exercise for 30 minutes at least such as walking, swimming, or cycling on most days of the week.
                </p>
              </div>

              {/* Monitoring Blood Sugar */}
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: headingColor }}>
                  Monitoring Blood Sugar
                </h3>
                <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                  Through regular check-ups of your blood sugar, you can be sure how your body behaves with different foods, activities, and medications. Therefore, the possibility to be aware and to keep your blood sugar at an acceptable level is achieved.
                </p>
              </div>

              {/* Medications and Insulin */}
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: headingColor }}>
                  Medications and Insulin
                </h3>
                <p className="leading-relaxed mb-4" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                  Depending on the kind and stage of your diabetes, your doctor might suggest the drugs to regulate the blood sugar counts. Some individuals with Type 2 diabetes may need insulin treatment if lifestyle corrections and the previously mentioned pills no longer keep their blood glucose level down.
                </p>
              </div>
            </div>

            {/* Prevention Strategies Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: headingColor }}>
                Prevention Strategies
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                For those at risk of developing diabetes, there are several ways to prevent or delay its onset:
              </p>

              <ul className="space-y-4 mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                <li>
                  <strong className="text-gray-800">Keep Fit and Eat Healthily:</strong> Loss of a small amount of weight (5%-10% of your body weight) can significantly lower your chances of getting Type 2 diabetes.
                </li>
                <li>
                  <strong className="text-gray-800">Be Active:</strong> Besides weight management, exercise regularly also enhances insulin sensitivity.
                </li>
                <li>
                  <strong className="text-gray-800">Frequent Self-Monitoring:</strong> If you have prediabetes or other risk factors, doing regular blood sugar tests can assist you in the early detection of problems.
                </li>
              </ul>
            </div>

            {/* Summary Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: headingColor }}>
                Summary
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                Diabetes is a potentially life-threatening disease, but early detection and aggressive treatment can significantly improve the quality of life and prevent further complications. Rapid action is required for any early symptoms of diabetes, for example, if you face fatigue, frequent urination, or excessive thirst, inform your healthcare provider promptly so that you can undergo the testing.
              </p>
              <p className="leading-relaxed mb-6" style={{ color: bodyColor, fontSize: bodyFontSize, lineHeight: bodyLineHeight }}>
                At Rasayana Bio, we are committed to raising awareness about diabetes and providing resources for those affected by the condition. Visit www.rasayanabio.com to learn more about how you can manage and prevent diabetes, and take control of your health today.
              </p>
              
              {/* Hashtags */}
              <div className="mb-6 flex flex-wrap gap-2">
                <span style={{ color: bodyColor, fontSize: bodyFontSize }}>#Diabetes</span>
              </div>

              {/* Social Media Icons */}
              <div className="flex gap-4 mb-10">
                <a href="https://facebook.com/rasayanabio" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition">
                  <span className="font-bold text-sm">f</span>
                </a>
                <a href="https://twitter.com/rasayanabio" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-400 text-white flex items-center justify-center hover:bg-blue-500 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                  </svg>
                </a>
                <a href="https://linkedin.com/company/rasayanabio" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800 transition">
                  <span className="font-bold text-xs">in</span>
                </a>
                <a href="https://instagram.com/rasayanabio" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center hover:bg-pink-700 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Post a Comment Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#374151' }}>
                Post a Comment
              </h2>
              <p className="text-gray-600 mb-6" style={{ fontSize: bodyFontSize }}>
                Your email address will not be published. Required fields are marked *
              </p>
              
              <form className="space-y-6">
                <div>
                  <label htmlFor="comment" className="block text-gray-700 mb-2" style={{ fontSize: bodyFontSize }}>
                    Comment <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    rows="6"
                    required
                    className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y"
                    style={{ fontSize: bodyFontSize }}
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="name" className="block text-gray-700 mb-2" style={{ fontSize: bodyFontSize }}>
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    style={{ fontSize: bodyFontSize }}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-700 mb-2" style={{ fontSize: bodyFontSize }}>
                    Your Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    style={{ fontSize: bodyFontSize }}
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-gray-700 mb-2" style={{ fontSize: bodyFontSize }}>
                    Your Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    style={{ fontSize: bodyFontSize }}
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      className="mt-1 mr-2"
                    />
                    <span className="text-gray-700" style={{ fontSize: bodyFontSize }}>Save my name, email, and website in this browser for the next time I comment.</span>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      required
                      className="mt-1 mr-2"
                    />
                    <span className="text-gray-700" style={{ fontSize: bodyFontSize }}>I have read and agree to the Terms and Conditions and Privacy Policy. <span className="text-red-500">*</span></span>
                  </label>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 p-4 border border-gray-300 rounded bg-gray-50">
                    <input
                      type="checkbox"
                      id="recaptcha"
                      className="w-4 h-4"
                    />
                    <label htmlFor="recaptcha" className="text-gray-700 cursor-pointer" style={{ fontSize: bodyFontSize }}>
                      I'm not a robot
                    </label>
                    <div className="ml-auto flex items-center gap-2 text-gray-500" style={{ fontSize: bodyFontSize }}>
                      <span>reCAPTCHA</span>
                      <div className="flex flex-col" style={{ fontSize: bodyFontSize }}>
                        <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy</a>
                        <a href="/terms-of-service" className="text-blue-600 hover:underline">Terms</a>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition"
                >
                  SEND COMMENT
                </button>
              </form>
            </div>

            {/* Similar Posts Section */}
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: headingColor }}>
                Similar Posts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Post 1 - Magnesium Article */}
                <article className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100">
                  <div className="relative w-full h-64 overflow-hidden">
                    <img
                      src="/assets/Key-Roles-of-Magnesium-in-the-Bo-scaled.jpg"
                      alt="Comprehensive Benefits of Magnesium"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#f59e0b', color: '#fff' }}>
                        health
                      </span>
                      <span className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#84cc16', color: '#fff' }}>
                        healthy
                      </span>
                      <span className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#22c55e', color: '#fff' }}>
                        lifestyle
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 mb-3" style={{ fontSize: bodyFontSize }}>
                      September 1, 2025 • By Dr Monisha Singhal
                    </p>
                    <Link to="/comprehensive-benefits-of-magnesium-for-overall-wellness">
                      <h3 className="text-xl font-bold text-green-800 mb-4 line-clamp-2 hover:text-green-900 cursor-pointer transition-colors">
                        Comprehensive Benefits of Magnesium for Overall Wellness
                      </h3>
                    </Link>
                    <p className="text-gray-700 leading-relaxed mb-4 line-clamp-2" style={{ fontSize: bodyFontSize }}>
                      Introduction to Magn
                    </p>
                    <Link
                      to="/comprehensive-benefits-of-magnesium-for-overall-wellness"
                      className="inline-block bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition font-semibold"
                    >
                      READ MORE
                    </Link>
                  </div>
                </article>

                {/* Post 2 - Diabetes Article (current article) */}
                <article className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100">
                  <div className="relative w-full h-64 overflow-hidden">
                    <img
                      src="/assets/diabetes-article.png"
                      alt="Early Detection of Diabetes"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#22c55e', color: '#fff' }}>
                        diabetes
                      </span>
                      <span className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#f59e0b', color: '#fff' }}>
                        health
                      </span>
                      <span className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: '#84cc16', color: '#fff' }}>
                        healthy
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 mb-3" style={{ fontSize: bodyFontSize }}>
                      October 9, 2024 • By Dr Monisha Singhal
                    </p>
                    <Link to="/early-detection-of-diabetes">
                      <h3 className="text-xl font-bold text-green-800 mb-4 line-clamp-2 hover:text-green-900 cursor-pointer transition-colors">
                        Stay Healthy, Stay Informed: Early Detection of Diabetes and Preventive Strategies
                      </h3>
                    </Link>
                    <p className="text-gray-700 leading-relaxed mb-4 line-clamp-2" style={{ fontSize: bodyFontSize }}>
                      Uncontrolled diabete
                    </p>
                    <Link
                      to="/early-detection-of-diabetes"
                      className="inline-block bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition font-semibold"
                    >
                      READ MORE
                    </Link>
                  </div>
                </article>
              </div>
            </div>

            {/* Sidebar - Right Side */}
          </main>

          <aside className="lg:w-1/4 order-1 lg:order-2">
            {/* Search Box */}
            <div className="mb-8">
              <form className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600 transition-colors"
                  style={{ fontSize: bodyFontSize }}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded hover:bg-gray-100 transition"
                  style={{ color: headingColor }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: headingColor }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: headingColor }}>|</span>
                Categories
              </h3>
              <div className="space-y-0">
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Ayurvedic (1)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Diabetes (1)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Health (3)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Healthy (2)</span>
                </button>
                <button className="transition-colors flex items-center w-full py-2.5 text-left" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                  <span className="mr-2" style={{ color: '#666', fontSize: '8px' }}>•</span>
                  <span>Lifestyle (1)</span>
                </button>
              </div>
            </div>

            {/* Recent Posts */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-6 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: headingColor }}>|</span>
                Recent Posts
              </h3>
              <div className="space-y-5">
                <Link to="/comprehensive-benefits-of-magnesium-for-overall-wellness" className="flex gap-4 group">
                  <img
                    src="/assets/Key-Roles-of-Magnesium-in-the-Bo-scaled.jpg"
                    alt="Recent Post"
                    className="w-24 h-24 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="mb-2 leading-snug group-hover:text-green-700 transition-colors" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                      Comprehensive Benefits of Magnesium for
                    </p>
                    <p className="text-gray-500" style={{ fontSize: bodyFontSize }}>September 1, 2025</p>
                  </div>
                </Link>
                <Link to="/early-detection-of-diabetes" className="flex gap-4 group">
                  <img
                    src="/assets/diabetes-article.png"
                    alt="Recent Post"
                    className="w-24 h-24 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="mb-2 leading-snug group-hover:text-green-700 transition-colors" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                      Stay Healthy, Stay Informed: Early Detec
                    </p>
                    <p className="text-gray-500" style={{ fontSize: bodyFontSize }}>October 9, 2024</p>
                  </div>
                </Link>
                <Link to="/6-good-sources-of-vitamin-d-for-vegans" className="flex gap-4 group">
                  <img
                    src="/assets/vitamin-d-article.png"
                    alt="Recent Post"
                    className="w-24 h-24 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="mb-2 leading-snug group-hover:text-green-700 transition-colors" style={{ color: bodyColor, fontSize: bodyFontSize }}>
                      6 good sources of vitamin D for vegans
                    </p>
                    <p className="text-gray-500" style={{ fontSize: bodyFontSize }}>February 27, 2020</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center uppercase tracking-wide" style={{ color: '#000' }}>
                <span className="mr-2" style={{ color: headingColor }}>|</span>
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1.5 rounded font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6', fontSize: bodyFontSize }}>
                  DIABETES
                </button>
                <button className="px-3 py-1.5 rounded font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6', fontSize: bodyFontSize }}>
                  HEALTH
                </button>
                <button className="px-3 py-1.5 rounded font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6', fontSize: bodyFontSize }}>
                  HEALTHY
                </button>
                <button className="px-3 py-1.5 rounded font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6', fontSize: bodyFontSize }}>
                  PREVENTION
                </button>
                <button className="px-3 py-1.5 rounded font-medium border border-gray-300 hover:bg-green-50 transition-colors" style={{ color: '#374151', backgroundColor: '#f3f4f6', fontSize: bodyFontSize }}>
                  EARLY DETECTION
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <CloneFooter />
    </div>
  );
};

export default DiabetesArticle;

