import React from 'react';

const CloneFooter: React.FC = () => {
  return (
    <footer className="bg-[#0b1320] text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="rounded-2xl p-8 md:p-12 text-center mb-10 bg-gradient-to-r from-[#2f9e44] via-[#1f8f45] to-[#168a48] relative overflow-hidden">
          <div className="pointer-events-none absolute -top-10 -left-10 w-64 h-64 bg-white/15 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -right-16 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="text-[38px] md:text-[46px] leading-none font-serif tracking-wide font-extrabold mb-4 select-none">
              RasayanaBio
            </div>
            <div className="text-[18px] md:text-[20px] font-semibold mb-2">Get Exclusive Access & 10% Off</div>
            <div className="text-white/90 mb-8">When you sign up for our newsletter!</div>
            <form onSubmit={(e) => e.preventDefault()} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
              <input type="email" required placeholder="Email Address" className="flex-1 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500" />
              <button className="px-8 py-3 rounded-xl bg-[#0b4f2c] hover:bg-[#083e23] font-semibold shadow-sm">
                SUBSCRIBE
              </button>
            </form>
            <div className="mt-7 flex flex-wrap justify-center gap-x-8 gap-y-3 text-[14px] text-white">
              <a className="hover:underline" href="#">Shipping Policy</a>
              <a className="hover:underline" href="#">Terms Of Service</a>
              <a className="hover:underline" href="#">Privacy Policy</a>
              <a className="hover:underline" href="#">Refund Policy</a>
              <a className="hover:underline" href="#">Disclaimer</a>
              <a className="hover:underline" href="#">Press Release</a>
            </div>
          </div>
        </div>
        <div className="text-center text-gray-300">
          <p className="mb-5">Copyright© 2025, RasayanaBio All rights reserved</p>
          <div className="flex items-center justify-center gap-3">
            <span className="w-9 h-9 grid place-items-center rounded-full bg-white/10">f</span>
            <span className="w-9 h-9 grid place-items-center rounded-full bg-white/10">t</span>
            <span className="w-9 h-9 grid place-items-center rounded-full bg-white/10">ig</span>
            <span className="w-9 h-9 grid place-items-center rounded-full bg-white/10">in</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CloneFooter;


