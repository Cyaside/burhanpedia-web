import React, { useState } from "react";
import { Mail, Globe, Send } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const WEB3FORMS_ACCESS_KEY = "dc14701b-1db1-423f-b50e-c2b8b5546af8";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage("");
    const data = {
      access_key: WEB3FORMS_ACCESS_KEY,
      ...formData,
    };
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        setStatusMessage("Message sent successfully! Thank you for reaching out.");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatusMessage(`Failed to send message: ${result.message || "An unknown error occurred."}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setStatusMessage("Failed to send message. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="max-w-lg mx-auto my-16 p-8 rounded-xl shadow-lg bg-background border border-border"
    >
      <h2 className="text-3xl font-bold mb-2 text-primary">Contact Us</h2>
      <p className="mb-6 text-muted-foreground">We love to hear messages from you! Fill out the form below and we will get back to you soon.</p>
      <form onSubmit={sendEmail} className="space-y-5">
        <div className="flex items-center gap-2">
          <Mail className="text-primary" size={20} />
          <Input
            name="email"
            type="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <Globe className="text-primary" size={20} />
          <Input
            name="name"
            type="text"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="flex-1"
          />
        </div>
        <div>
          <Textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={5}
            className="resize-none"
          />
        </div>
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
          <Button type="submit" disabled={loading} className="w-full flex items-center gap-2">
            <Send size={18} />
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </motion.div>
        {statusMessage && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm mt-2 text-primary"
          >
            {statusMessage}
          </motion.p>
        )}
      </form>
    </motion.section>
  );
}
