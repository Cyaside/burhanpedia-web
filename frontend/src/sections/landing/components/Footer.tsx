import React, { JSX } from "react";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Twitter, Github, Mail, ShoppingCart, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer(): JSX.Element {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="w-full bg-white border-t border-gray-200 mt-auto"
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* BRAND */}
          <div className="space-y-4 min-w-0">
            <div className="flex items-center gap-3">
              <Image
                src="/burhan.jpg"
                alt="BurhanPedia logo"
                width={56}
                height={56}
                className="rounded-md object-cover"
                priority={false}
              />
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 leading-tight">BurhanPedia</h3>
                <p className="text-sm text-slate-500 truncate">Your marketplace for curated</p>
                <p className="text-sm text-slate-500 truncate">products & trusted sellers</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <nav className="flex items-center gap-2">
                <motion.a whileHover={{ y: -3 }} className="p-2 rounded-md hover:bg-gray-100" href="#" aria-label="Twitter">
                  <Twitter className="w-5 h-5 text-red-600" />
                </motion.a>
                <motion.a whileHover={{ y: -3 }} className="p-2 rounded-md hover:bg-gray-100" href="#" aria-label="GitHub">
                  <Github className="w-5 h-5 text-green-600" />
                </motion.a>
                <motion.a whileHover={{ y: -3 }} className="p-2 rounded-md hover:bg-gray-100" href="#" aria-label="Email">
                  <Mail className="w-5 h-5 text-blue-600" />
                </motion.a>
              </nav>
            </div>

            {/* quick facts */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                <span>Secure checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>Multiple payment options</span>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-500">&copy; {new Date().getFullYear()} BurhanPedia — All rights reserved.</div>
          </div>

          {/* Customer Service buat nanti */}
          <div>
            <h4 className="text-sm font-medium text-slate-700">Customer service</h4>
            <nav className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
              <Link className="hover:text-green-600 transition-colors" href="#">Help Center</Link>
              <Link className="hover:text-green-600 transition-colors" href="#">Shipping & Returns</Link>
              <Link className="hover:text-green-600 transition-colors" href="#">Track Order</Link>
              <Link className="hover:text-green-600 transition-colors" href="#">Contact Us</Link>
            </nav>
          </div>

          {/* Seller Center buat nanti */}
          <div>
            <h5 className="text-sm font-medium text-slate-700">Sell with us</h5>
            <nav className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
              <Link className="hover:text-blue-600 transition-colors" href="#">Seller Center</Link>
              <Link className="hover:text-blue-600 transition-colors" href="#">Seller Fees</Link>
            </nav>
          </div>
        </div>

        {/* bottom footer */}
        <div className="mt-8 border-t border-gray-100 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-700">Privacy</span>
            <span className="hover:text-slate-700">Terms</span>
            <span className="hover:text-slate-700">Sitemap</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs">Language: <strong>EN</strong></div>
            <div className="text-xs">Currency: <strong>IDR</strong></div>
            <div className="text-xs">Version 1.2.3</div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}