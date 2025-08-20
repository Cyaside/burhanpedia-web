import React, { JSX } from "react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Twitter, Github, Mail } from "lucide-react";
import { motion } from "framer-motion";

// Clean, compact footer layout
// - replaces Card with simple flex layout
// - uses /burhan.jpg from public folder as logo
// - fixes spacing so icons and copyright sit inline

export default function Footer(): JSX.Element {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="w-full bg-white border-t border-gray-200 mt-auto"
      aria-label="Site footer"
    >
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* LEFT: logo + text + socials */}
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex-shrink-0">
              <Image
                src="/burhan.jpg"
                alt="BurhanPedia logo"
                width={48}
                height={48}
                className="rounded-md object-cover"
                priority={false}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-900 leading-tight">BurhanPedia</h3>
              </div>

              <p className="text-sm text-slate-500 mt-1 truncate">Curated knowledge — build, learn, repeat.</p>

              <div className="flex items-center gap-4 mt-3">
                <p className="text-sm text-slate-600 mr-2">&copy; {new Date().getFullYear()} BurhanPedia. All rights reserved.</p>

                <nav className="flex items-center gap-2">
                  <motion.a
                    whileHover={{ y: -3 }}
                    className="p-2 rounded-md hover:bg-red-50"
                    href="#"
                    aria-label="Twitter"
                    rel="noopener noreferrer"
                  >
                    <Twitter className="w-5 h-5 text-red-600" />
                  </motion.a>

                  <motion.a
                    whileHover={{ y: -3 }}
                    className="p-2 rounded-md hover:bg-green-50"
                    href="#"
                    aria-label="GitHub"
                    rel="noopener noreferrer"
                  >
                    <Github className="w-5 h-5 text-green-600" />
                  </motion.a>

                  <motion.a
                    whileHover={{ y: -3 }}
                    className="p-2 rounded-md hover:bg-blue-50"
                    href="#"
                    aria-label="Email"
                    rel="noopener noreferrer"
                  >
                    <Mail className="w-5 h-5 text-blue-600" />
                  </motion.a>
                </nav>
              </div>
            </div>
          </div>

          {/* CENTER: quick links*/}
          <div className="flex justify-center md:justify-center gap-10">
            <div>
              <h4 className="text-sm font-medium text-slate-700">Product</h4>
              <nav className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                <Link className="hover:text-red-600 transition-colors" href="#">Features</Link>
                <Link className="hover:text-green-600 transition-colors" href="#">Pricing</Link>
                <Link className="hover:text-blue-600 transition-colors" href="#">Docs</Link>
              </nav>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-700">Company</h4>
              <nav className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                <Link className="hover:text-red-600 transition-colors" href="#">About</Link>
                <Link className="hover:text-green-600 transition-colors" href="#">Careers</Link>
                <Link className="hover:text-blue-600 transition-colors" href="#">Press</Link>
              </nav>
            </div>
          </div>

          {/* RIGHT: newsletter */}
          <div className="md:pl-6 min-w-[220px]">
            <h4 className="text-sm font-medium text-slate-700">Stay in the loop</h4>
            <p className="text-sm text-slate-600 mt-2">Get occasional updates, tutorials, and short tips.</p>

            <motion.form
              whileTap={{ scale: 0.995 }}
              className="mt-3 flex flex-col sm:flex-row gap-3"
              onSubmit={(e) => e.preventDefault()}
            >
              <Input placeholder="Your email" aria-label="Email address" className="min-w-0" />
              <Button type="submit" className="whitespace-nowrap">Subscribe</Button>
            </motion.form>

            <Separator className="my-4" />

            <div className="text-xs text-slate-500">Made with <span className="text-red-600">&#10084;</span> by BurhanPedia Team</div>
          </div>
        </div>

        {/* bottom tiny footer */}
        <div className="mt-8 border-t border-gray-100 pt-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <span>Privacy · Terms · Sitemap</span>
          <span className="text-slate-400">Version 1.2.3</span>
        </div>
      </div>
    </motion.footer>
  );
}
